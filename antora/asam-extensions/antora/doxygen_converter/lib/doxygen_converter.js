'use strict'
const fs = require("fs");
const path = require("path");
const jsdom = require('jsdom');


/**
 * Main function for converting doxygen output files to virtual content for Antora.
 * HTML files are converted to AsciiDoc, JS files are analyzed for the navigation. All other files are moved virtually to the images folder.
 * @param {String} sourcePath - The path to where the doxygen output is located.
 * @param {String} targetPath - The virtual path of the files after generation.
 * @param {String} modulePath - The path of the module for the virtual files.
 * @param {String} imgPath - The path of the virtual image files.
 * @param {String} moduleContentPath - The path for all files within the defined module.
 * @returns Array<Array<Object>,Object> - An array with the virtual content files (as a nested array) and the navigation file.
 */
function htmlToAsciiDoc(sourcePath = "ASAM_OSI_reference", targetPath = "ASAM_OSI_reference/converted", modulePath = "../_antora/modules/ROOT", imgPath = "../_attachments", moduleContentPath = "") {
    let virtualFiles = [],
        navFile = {name:"nav.adoc",path:modulePath,content:Buffer.from("","utf-8")}

    const imgRef = path.relative(modulePath,imgPath.replace("/images","/_images"))
    walkDir(sourcePath, function(filepath) {
        const extension = path.extname(filepath)
        const filename = path.basename(filepath)
        const currentPath = path.dirname(filepath)
        
        switch(extension) {
            case ".html":
                parseFileAndCreateAdoc(currentPath, filename, targetPath, imgRef, virtualFiles);
                break;
            case ".js":
                getNavigationStructure(currentPath, filename, moduleContentPath, navFile);
                break;
            default:
                const imagePath = path.relative(sourcePath,currentPath) === "" ? imgPath : imgPath+"/"+path.relative(sourcePath,currentPath);
                virtualFiles.push({name:filename,path:imagePath,content:fs.readFileSync(currentPath+"/"+filename)});
        }
    })
    return [virtualFiles,navFile]
}

/**
 * Helper function for walking through a folder and its sub-folders.
 * @param {String} dir - The directory to traverse.
 * @param {Function} callback - A callback function to execute on found files.
 */
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
      let dirPath = path.join(dir, f);
      let isDirectory = fs.statSync(dirPath).isDirectory();
      isDirectory ? 
        walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
  };

/**
 * Extracts a variable and all nested variables from a given file.
 * @param {String} sourcePath - The path to the file's directory.
 * @param {String} filename - The filename, including extension.
 * @param {String} varName - The variable to parse.
 * @param {Array<String>} parsedContent - The already parsed content.
 * @param {Integer} currentLevel - The current navigation list level.
 */
function parseJsVar(sourcePath, filename, varName, parsedContent, currentLevel = 1) {
    let sourceContent = fs.readFileSync(sourcePath+"/"+filename, "utf-8")
    const regex = new RegExp(varName+"\\s*=(([^;])*)","m")
    const match = sourceContent.match(regex)
    const varValue = match ? JSON.parse(match[1].replace("\n","")) : null
    if (varValue){
        parsingLoop(sourcePath, filename, varName, varValue, currentLevel, parsedContent)
    }
}

/**
 * Loop function for recursive parsing of a JS variable from a text file.
 * @param {String} sourcePath - The path to the file's directory.
 * @param {String} filename - The filename, including extension.
 * @param {String} varName - The variable to parse.
 * @param {String} varValue - The string containing the unparsed value of the variable.
 * @param {Integer} currentLevel - The current navigation list level.
 * @param {Array<String>} parsedContent - The already parsed content.
 */
function parsingLoop(sourcePath, filename, varName, varValue, currentLevel, parsedContent) {
    varValue.forEach((entry) => {
        const label = entry[0]
        const link = entry[1] ? entry[1].replace(".html",".adoc") : entry[1]
        const children = entry[2]
        parsedContent.push({label:label,link:link,level:currentLevel})
        if(children) {
            if (Array.isArray(children)) {
                parsingLoop(sourcePath, filename, varName, children, currentLevel+1, parsedContent)
            }
            else {
                parseJsVar(sourcePath, children+".js", children, parsedContent, currentLevel+1)
            }
        }
    })
}

/**
 * Creates the nav.adoc file's content from the provided doxygen navigation file(s).
 * @param {String} sourcePath - The path to the file's directory.
 * @param {String} filename - The filename, including extension.
 * @param {String} targetPath - The path for the virtual files.
 * @param {Object} navFile - The prefilled navigation file.
 */
function getNavigationStructure(sourcePath, filename, targetPath, navFile) {
    if (filename === "navtreedata.js") {
        let path = targetPath ? targetPath+"/" : ""
        let content = ""
        let navTree = []
        parseJsVar(sourcePath,filename,"NAVTREE", navTree)
        navTree.forEach( (navEntry) => {
            if (navEntry.level > 5){}
            else if (navEntry.link && navEntry.link !== "") {
                content = [content,":sectnums!:","*".repeat(navEntry.level) + ` xref:${path}${navEntry.link}[${navEntry.label}] `].join("\n")
            }
            else {
                content = [content,":sectnums!:","*".repeat(navEntry.level) + ` ${navEntry.label} `].join("\n")
            }
        })
        navFile.content = Buffer.from(content, "utf-8")
    }
}

/**
 * Creates a virtual file from a given doxygen html file.
 * @param {String} sourcePath - The path to the file's directory.
 * @param {String} filename - The filename, including extension.
 * @param {String} targetPath - The path for the virtual files.
 * @param {String} imgPath - The path for all images.
 * @param {Array<Object>} virtualFiles - The array of created virtual files.
 */
function parseFileAndCreateAdoc(sourcePath, filename, targetPath, imgPath, virtualFiles) {
    var content="",
        title="",
        adocContent = ""

    content = fs.readFileSync(sourcePath+"/"+filename, 'utf8')
    content = content.replaceAll(/<img ([^\n]*)src=\"(?!http)/ig, `<img $1src="${imgPath}/`)
    content = content.replaceAll(/<object type=\"image\/(.*)\" data=\"(?!http)/ig, `<object type="image/$1" data="${imgPath}/`)
    content = content.replaceAll(/<h2 class="memtitle">(.*)<\/h2>/ig, `<h3 id="sec_nn" class="memtitle">$1</h3>`)
    var contentSplit = content.split("\n")
    let i = 0
    for (let index in contentSplit) {
        if (contentSplit[index].includes("sec_nn")) {
            contentSplit[index] = contentSplit[index].replace("sec_nn","sec_"+i.toString())
            i++;
        }
    }
    content = contentSplit.join("\n")
    const dom = new jsdom.JSDOM(content)
    const jq = require("jquery")(dom.window)
    title = jq('div.title').text()
    if (title.length < 1 || title === "") {
        title = jq('title').text()
    }
    if (title === "") {return}
    jq('.contents h3').wrap('<div class="sect2"></div>')
    
    // Doxygen puts sections inside tables, AsciiDoc does not work this way. Act on all tables that contain h2 tags: Move h2 tags in front, then delete heading and its children
    jq('.contents h2').parents("table").each(function(entry) {
        jq(this).find("h2").insertBefore(this)
        jq(this).find(".heading").remove()
    })

    // Remove all obsolete a tags within h2 tags
    jq('h2.groupheader a').remove()
    
    // Populate adoc content
    let currentHeader = "= " + title + "\n:page-width-limit: none\n\n"
    adocContent = currentHeader
    if (!jq(".contents").children().first().is("h2")) {
        adocContent +="++++\n"
    }
    jq(".contents").children().each(function(child) {
        if (jq(this).is("h2")){
            adocContent += `\n++++\n\n== ${jq(this).text().replace("\n","")}\n\n++++\n`
        }
        else {
            adocContent = [adocContent,jq(this).prop("outerHTML")].join("\n")
        }
    })
    const count = (adocContent.match(/\+{4}\n/g) || []).length;
    if (count%2 === 1) {
        adocContent +="++++\n"
    }

    // Add everything to the virtual files array
    virtualFiles.push({name:filename.replace(".html",".adoc"),path:targetPath,content:Buffer.from(adocContent, "utf-8")})
}

module.exports = {
    htmlToAsciiDoc
}