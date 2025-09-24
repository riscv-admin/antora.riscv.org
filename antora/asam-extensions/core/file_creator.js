'use strict'
//-------------
//-------------
// Core module for creating new virtual files in Antora.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const File = require('./file.js');
const fs = require("fs");
const path = require("path");
const helper = require("./helper.js")

/**
 * Creates a new virtual file in Antora with a given filename and path in a module.
 * The file is added to a specific component-version-combination and may optionally be declared something other than "page".
 * @param {Object} contentCatalog - The current content catalog as provided by Antora.
 * @param {String} filename - The target name of the new virtual file, including extension.
 * @param {String} path - The target path of the virtual file within a module.
 * @param {String} module - The module of the virtual file.
 * @param {String} component - The component of the virtual file.
 * @param {String} version - The component version of the virtual file.
 * @param {*} content - The content of the virtual file. String or Buffer.
 * @param {Object} base - The base information of the virtual file.
 * @param {String} type - Optional: The type of virtual file. Default: page.
 * @returns {Object} The created virtual file object.
 */
function createNewVirtualFile( contentCatalog, filename, path, module, component, version, content, base, type="page" ) {
    if (typeof content === 'string' || content instanceof String){
        content = Buffer.from(content)
    }
    let typeFolder;
    let mediaType
    switch(type){
        case "page":
            typeFolder = "/pages/"
            mediaType = "text/html"
            break;
        case "partial":
            typeFolder = "/partials/"
            mediaType = "text/html"
            break;
    }
    if(!path.endsWith("/") && path !== ""){
        path = path+"/"
    }
    let newFile = new File({ base: base, path: "modules/"+module+typeFolder+path+filename, contents: content, mediaType: mediaType})
    let moduleRootPath = path=== "/" ? ".." : path.replace(/([^//])*/,"..")+".."
    newFile.src = {}
    Object.assign(newFile.src, { path: newFile.path, basename: newFile.basename, stem: newFile.stem, extname: newFile.extname, family: type, relative: path+filename, mediaType: 'text/asciidoc', component: component, version: version, module: module, moduleRootPath: moduleRootPath, origin: {url: 'generated', startPath: 'generated', refname: 'generated', reftype: 'generated', refhash: 'generated'} })
    contentCatalog.addFile(newFile)
    return (newFile)
}

/**
 * Creates a new virtual file for each folder that is identified in a given array of pages.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {String} component - The component of the virtual folder files.
 * @param {String} version - The component version of the virtual folder files.
 * @param {String} module - The module of the virtual folder files.
 * @param {Array <Object>} pages - An array of pages.
 * @returns {Array <Object>} Array of all created folder files.
 */
function createVirtualFilesForFolders( contentCatalog, component, version, module, pages ) {
    var folderFiles = new Object()
    const base = pages[0].base
    pages.forEach((page) => {
        let relativePath = ""
        //-------------
        // Only act if the analyzed page is in a folder. Otherwise, page.src.relative === page.src.basename
        //-------------
        if (page.src.basename !== page.src.relative) {
            relativePath = page.src.relative.replace("/"+page.src.basename,"")
            while (true) {
                //-------------
                // If the relative path cannot be determined, exit the loop.
                //-------------
                if (!relativePath ) {
                    return false
                }
                //-------------
                // Only continue if there folderFiles does not yet contain an entry for this folder.
                //-------------
                if (Object.keys(folderFiles).indexOf(relativePath) < 0) {
                    let folderName = relativePath
                    //-------------
                    // Skip excluded folders (beginning with "_" or ".")
                    //-------------
                    if (folderName.startsWith("_") || folderName.startsWith(".")) {
                        return false;
                    }
                    const start = folderName.lastIndexOf("/")
                    if (start > 0) {
                        folderName = folderName.slice(start+1)
                    }
                    let parentPath = relativePath.slice(0,relativePath.lastIndexOf(folderName))
                    parentPath = parentPath.endsWith("/") ? parentPath.slice(0,-1) : parentPath
                    const folderFileName = folderName+".adoc"
                    //-------------
                    // Only create a new file for folders that do not already have an actual file with the same name.
                    //-------------
                    if(pages.findIndex((element,index) => {
                        if(element.src.relative === parentPath+"/"+folderFileName || element.src.relative === folderFileName) {
                            return true
                        }
                    }) === -1) {
                        let content = new Array(
                            "= "+helper.capitalizeFirstLetter(folderName).replace("_"," "),
                            ":description: Auto-generated folder page",
                            ":keywords: generated, autonav",
                            "",
                            `pages::[path=${folderName}]`
                        )
                        let newFile = createNewVirtualFile( contentCatalog, folderFileName, parentPath, module, component, version, content.join("\n"), base )
                        folderFiles[relativePath]=newFile
                    }
                    const relativePathNew = relativePath.replace("/"+folderName,"")
                    if (relativePathNew === relativePath) {
                        return false
                    }
                    else {
                        relativePath = relativePathNew
                    }
                }
                else {
                    return false
                }
            }
        }
    })
    return (Array.from(Object.values(folderFiles)))
}


/**
 * Scans through a folder and adds all files in there as virtual files to Antora.
 * This is required if the files come from outside the Antora folders or were created/added after Antora had already scanned the repositories.
 * IMPORTANT: This is currently hard wired to create files where the origin is "doxygen".
 * @param {String} inputPath - The path to scan.
 * @param {String} targetPath - The relative target path of the virtual files.
 * @param {Object} defaultOrigin - A default origin required by Antora.
 * @param {String} abspathPrefix - A prefix for the absolute path.
 * @param {Boolean} recursive - Optional: If true, also scans all sub-directories in the input path.
 * @returns {Array <Object>} An array of the created virtual files.
 */
function addAllFilesInFolderAsVirtualFiles( inputPath, targetPath, defaultOrigin, abspathPrefix, recursive=false ) {
    let newFiles = []
    const filesAndDirectories = fs.readdirSync(inputPath, { withFileTypes: true });
    const files =  filesAndDirectories
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);
    for(let f of files) {
        try {
            const contents = fs.readFileSync(inputPath+"/"+f)
            let src = {
                    "path": targetPath+"/"+f,
                    "basename": f,
                    "stem": path.basename(f,path.extname(f)),
                    "extname": path.extname(f),
                    "origin": {
                        "type": "doxygen"
                }
            }
            if (src.extname === "undefined" || !src.extname) {
                console.log(f, f.split(".")[0], f.split(".")[1])
            }
            let file = new File({
                path: src.path,
                contents: contents,
                src: src
            })
            file.src.origin = defaultOrigin
            if (abspathPrefix) {
                file.src.abspath = abspathPrefix+file.src.path
            }
            newFiles.push(file)

        } catch(e){
            console.log(e)
        }

    }
    if(recursive) {
        const folders = filesAndDirectories
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
        for (let folder of folders){
            const extraFiles = addAllFilesInFolderAsVirtualFiles(inputPath+"/"+folder, targetPath+"/"+folder, defaultOrigin, abspathPrefix, recursive )
            newFiles = newFiles.concat(extraFiles)
        }
    }
    return(newFiles)
  }


/**
 * Converts all entries of an array to virtual files for Antora.
 * Array entries must be {name:<source name of file>,path:<target output path>,content:<content as buffer>}
 * @param {Array <Object>} inputArray - The array containing the data for all new virtual files.
 * @param {Object} defaultOrigin - A default origin required by Antora.
 * @param {String} abspathPrefix - A prefix for the absolute path.
 * @returns {Array <Object>} An array of the created virtual files.
 */
function convertArrayToVirtualFiles( inputArray, defaultOrigin, abspathPrefix ) {
    let newFiles = []
    for(let f of inputArray) {
        try {
            const contents = f.content
            let src = {
                    "path": f.path+"/"+f.name,
                    "basename": f.name,
                    "stem": path.basename(f.name,path.extname(f.name)),
                    "extname": path.extname(f.name),
                    "origin": {
                        "type": "doxygen"
                }
            }
            if (src.extname === "undefined" || !src.extname) {
                console.log(f.name, f.name.split(".")[0], f.name.split(".")[1])
            }
            let file = new File({
                path: src.path,
                contents: contents,
                src: src
            })
            file.src.origin = defaultOrigin
            if (abspathPrefix) {
                file.src.abspath = abspathPrefix+file.src.path
            }
            newFiles.push(file)

        } catch(e){
            console.log(e)
        }

    }
    return(newFiles)
  }



module.exports = {
    createNewVirtualFile,
    createVirtualFilesForFolders,
    addAllFilesInFolderAsVirtualFiles,
    convertArrayToVirtualFiles
}