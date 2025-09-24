'use strict'
//-------------
//-------------
// Module for the custom ASAM macros.
// This module provides a central function, 'findAndReplaceCustomASAMMacros', that parses each adoc file in a component-version-combination and replaces each occurrence of a custom ASAM macro with the corresponding AsciiDoc code.
// The following macros are supported:
// * role_related
// * related
// * reference
// * autonav
// * pages
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require('../../core/content_analyzer.js')
const FileCreator = require('../../core/file_creator.js')
const Helper = require('./lib/helper.js')

/**
 * Replaces the ASAM macro 'role_related'.
 * @param {Object} page - The page where the macro was found in.
 * @param {Array <String>} pageContent - The content of this page.
 * @param {String} line - The line where the macro was found in.
 * @param {Array <any>} macroResult - The result of the regular expression for matching the role_related macro.
 * @param {String} heading - The heading to be used when replacing this macro.
 * @param {Map <String, Object>} rolePageMap - A map containing links between roles and the pages they are listed in.
 * @param {*} logger - The logger for the log output generation.
 * @returns {Array <String>} The updated page content.
 */
function replaceRoleRelatedMacro( page, pageContent, line, macroResult, heading, rolePageMap, logger ) {
    //-------------
    // Prepare with parsing the result and adding the current page as exception
    //-------------
    var resultValues = Helper.parseCustomXrefMacro(macroResult, line, heading)
    var exclusionSet = Helper.excludeSelf(page)
    var content = ""
    if (resultValues.parameters) {
        content = "\n"
    }
    else {
        content = resultValues.newLine
    }
    //-------------
    // For each attribute, get all pages that apply.
    // If the macro uses parameters, the page selection is limited to those pages that also contain the given set of keyword(s) (at least one of them).
    //-------------
    resultValues.attributes.split(",").forEach((el) => {
        const elTrimmed = el.trim()
        if (rolePageMap.has(elTrimmed)) {
            rolePageMap.get(elTrimmed).forEach((rolePage) => {
                var pageRelevant = true
                if (resultValues.parameters) {
                    pageRelevant = false
                    const keywords = ContentAnalyzer.getAllKeywordsAsArray(rolePage)
                    if (keywords) {
                        for (var k of resultValues.parameters.split(",").map(x => x.trim())) {
                            if (keywords[1].split(",").map(x => x.trim()).indexOf(k)>-1) {
                                pageRelevant = true
                            }
                        }
                    }
                }
                if (!exclusionSet.has(rolePage) && pageRelevant) {
                    const moduleName = rolePage.src.module
                    const modulePath = rolePage.src.relative
                    const linkText = `xref:${moduleName}:${modulePath}[]`
                    content = content.concat("\n",Helper.addNewBulletPoint(linkText))
                }
            })
        }
        else {
            logger.warn("Role not found")
        }
    })
    pageContent.splice(pageContent.indexOf(line),1,content)
    return (pageContent)
}

/**
 * Replaces the ASAM macro 'related' with a bullet point list of pages containing keywords listed by the macro.
 * @param {Object} page - The page where the macro was found in.
 * @param {Array <String>} pageContent - The content of this page.
 * @param {String} line - The line where the macro was found in.
 * @param {Array <any>} macroResult - The result of the regular expression for matching the related macro.
 * @param {String} heading - The heading to be used when replacing this macro.
 * @param {Map <String, Object>} keywordPageMap - A map containing links between keywords and the pages they are listed in.
 * @returns {Array <String>} The updated pageContent.
 */
function replaceRelatedMacro( page, pageContent, line, macroResult, heading, keywordPageMap ) {
    //-------------
    // Prepare with parsing the result and adding the current page as exception
    //-------------
    var resultValues = Helper.parseCustomXrefMacro(macroResult, line, heading)
    var exclusionSet = Helper.excludeSelf(page)
    exclusionSet = Helper.excludeNegatedAttributes(exclusionSet, resultValues.attributes, keywordPageMap)
    var content = resultValues.newLine
    //-------------
    // For each attribute, get all pages that apply.
    // If an attribute is negated (i.e. it starts with '!'), it is instead excluded and ignored.
    // Each entry that is left is then added as a bullet point cross reference to the target page.
    //-------------
    resultValues.attributes.split(",").forEach((el) => {
        const elTrimmed = el.trim()
        if (elTrimmed.startsWith("!")) {
        }
        else if (keywordPageMap.has(elTrimmed)) {
            keywordPageMap.get(elTrimmed).forEach((keywordPage) => {
                if (!exclusionSet.has(keywordPage)) {
                    const moduleName = keywordPage.src.module
                    const modulePath = keywordPage.src.relative
                    const linkText = `xref:${moduleName}:${modulePath}[]`
                    content = content.concat("\n",Helper.addNewBulletPoint(linkText))
                }
            })
        }
        else {
            const filename = page.src
            console.log(`No page for keyword ${el} found: file: ${filename}`)
            console.log(exclusionSet)
            console.log(keywordPageMap.keys())
        }
    })
    pageContent.splice(pageContent.indexOf(line),1,content)
    return (pageContent)
}

/**
 * Replaces the ASAM macro 'reference'. Note: This currently is just an alias for replaceRelatedMacro().
 * @param {Object} page - The page where the macro was found in.
 * @param {Array <String>} pageContent - The content of this page.
 * @param {String} line - The line where the macro was found in.
 * @param {Array <any>} macroResult - The result of the regular expression for matching the related macro.
 * @param {String} heading - The heading to be used when replacing this macro.
 * @param {Map <String, Object>} keywordPageMap - A map containing links between keywords and the pages they are listed in.
 * @returns {Array <String>} The updated pageContent.
 */
function replaceReferenceMacro( page, pageContent, line, macroResult, heading, keywordPageMap ) {
    return (replaceRelatedMacro(page, pageContent, line, macroResult, heading, keywordPageMap))
}

/**
 * Replaces the ASAM macro 'pages' with a bullet point list of pages in the requested location.
 * @param {Object} page - The page where the macro was found in.
 * @param {Array <String>} pageContent - The content of this page.
 * @param {String} line - The line where the macro was found in.
 * @param {Array <any>} macroResult - The result of the regular expression for matching the related macro.
 * @param {String} heading - The heading to be used when replacing this macro.
 * @param {Array <Object>} pages - The complete list of pages
 * @returns {Array <String>} The updated pageContent.
 */
function replacePagesMacro( page, pageContent, line, macroResult, heading, pages ) {
    //-------------
    // Prepare with parsing the result and adding the current page as exception
    //-------------
    var resultValues = Helper.parseCustomXrefMacro(macroResult, line, heading)
    var exclusionSet = Helper.excludeSelf(page)
    const parameterArray = resultValues.parameters.split(",")
    var content = resultValues.newLine
    var doAll = false
    var targetPath = page.dirname
    //-------------
    // Parse the detected parameters:
    // all: List all content from sub-directories as well.
    // path=<value>: Set the starting directory to <value> instead.
    //-------------
    for (let par of parameterArray) {
        var param = par.trim()
        if (param === "all") {
            doAll = true
        }
        else {
            param = param.split("=").map((e) => {
                e = e.trim()
                return (e);
            })
            if (param.indexOf("path") > -1) {
                const path = param[1]
                targetPath=targetPath+"/"+path
            }
        }
    }
    //-------------
    // Find all child pages that fulfill the defined conditions above.
    //-------------
    const childPagesArray = Helper.getChildPagesOfPath(pages, targetPath, doAll)
    for (let child of childPagesArray) {
        if (!exclusionSet.has(child)) {
            const moduleName = child.src.module;
            const modulePath = child.src.relative;
            const linkText = `xref:${moduleName}:${modulePath}[]`
            content = content.concat("\n",Helper.addNewBulletPoint(linkText))
        }
    }
    content += "\n"
    pageContent.splice(pageContent.indexOf(line),1,content)
    return(pageContent)
}

/**
 * Replaces the ASAM macro 'autonav' in a navigation file by creating the navigation content based on the modules folder structure.
 * @param {Object} contentCatalog - The content catalog provided by Antora for this component-version-combination.
 * @param {Array <Object>} pages - The array of pages extracted from the contentCatalog.
 * @param {Object} nav - The navigation file where the macro was found in.
 * @param {String} component - The component of the navigation file.
 * @param {String} version - The component version of the navigation file.
 * @param {Boolean} findModuleMainPage - Optional: If false, creates a structure without a dedicated module start page.
 * @returns {Array <Object>} The updated pages
 */
function replaceAutonavMacro( contentCatalog, pages, nav, component, version, findModuleMainPage=true ) {
    const moduleName = nav.src.module
    let modulePages = pages.filter(page => page.src.module === moduleName)
    //-------------
    // Add virtual files for all directories that do not have corresponding adoc files in their root directory.
    // Then, update the module's pages array accordingly and also add them to the array of pages for later functions.
    //-------------
    let addedVirtualPages = FileCreator.createVirtualFilesForFolders(contentCatalog,component,version,moduleName,modulePages)
    modulePages = [...modulePages,...addedVirtualPages]
    pages = [...pages,...addedVirtualPages]

    //-------------
    // If settings request a module start page, determine that page with the following rule and then have all other pages be at least one level lower in hierarchy:
    // 1) A page with the name of the module exists.
    // 2) A page named "index.adoc" exists
    // 3) A page named "main.adoc" exists.
    // Fallback: The first page in modulePages is used.
    //-------------
    let moduleStartPage = modulePages[0].basename
    const rootLevelPages = modulePages.filter(x => x.src.moduleRootPath === "..").map(x => x.stem)

    if (rootLevelPages.indexOf(moduleName) > -1) {
        moduleStartPage = moduleName+".adoc"
    }
    else if (rootLevelPages.indexOf("index") > -1){
        moduleStartPage = rootLevelPages[rootLevelPages.indexOf("index")]
    }
    else if (rootLevelPages.indexOf("main") > -1){
        moduleStartPage = "main.adoc"
    }

    let navBody = [""]
    if (findModuleMainPage) {
        navBody = ["* xref:"+moduleStartPage+"[]"]
    }
    modulePages.sort((a,b) => {
        var relA = a.src.path.replace(".adoc","").split("/")
        var relB = b.src.path.replace(".adoc","").split("/")
        var l = Math.max(relA.length, relB.length)
        for (var i = 0; i < l; i += 1) {
            if (!(i in relA)) return -1
            if (!(i in relB)) return 1
            if (relA[i] > relB[i]) return +1
            if (relA[i] < relB[i]) return -1
        }
    })
    modulePages.forEach( (page) => {
        let currentLevel = findModuleMainPage ? 2 : 1
        let moduleRootPath = page.src.moduleRootPath
        if (moduleRootPath.indexOf("/")>-1 ) {
            currentLevel = currentLevel-1 + moduleRootPath.split("/").length
        }
        let line = "*".repeat(currentLevel) + " xref:"+page.src.relative+"[]"
        if ((page.src.relative !== moduleStartPage || !findModuleMainPage) && ContentAnalyzer.isPublishableFile(page))  {
            navBody.push(line)
        }
    })
    nav.contents = Buffer.from(navBody.join("\n"))
    return pages
}

/**
 * Traverses through the adoc files of a component-version-combination and replaces all found ASAM macros.
 * This covers the following macros:
 * autonav, reference, related, role_related, pages
 * @param {Object} contentCatalog - The complete content catalog provided by Antora.
 * @param {Array <Object>} pages - The array of pages for this component-version-combination.
 * @param {Array <Object>} navFiles - The navigation files for this component-version-combination.
 * @param {Map <String,Object>} keywordPageMap - A map containing links between keywords and the pages they are listed in.
 * @param {Map <String,Object>} rolePageMap - A map containing links between roles and the pages they are listed in.
 * @param {Array <any>} macrosRegEx - A map of regular expressions for the supported macros.
 * @param {Map <String,String>} macrosHeadings - A map of headings for the supported macros.
 * @param {*} logger - A logger for creating log entries.
 * @param {String} component - The current component.
 * @param {String} version - The current version.
 * @returns {Array <Object>} The updated pages.
 */
function findAndReplaceCustomASAMMacros( contentCatalog, pages, navFiles, keywordPageMap, rolePageMap, macrosRegEx, macrosHeadings, logger, component, version) {
    //-------------
    // Apply the autonav detection on the navigation files first and replace any match.
    //-------------
    const re = macrosRegEx.find(x => x.macro === "autonav").re;
    for (let nav of navFiles) {
        var m;
        let result;
        const content = nav.contents.toString().split("\n")
        for (let line in content) {
            result = re.exec(content[line])
            if (result){
                break;
            }
        }
        if (result) {
            const findModuleMainPage = result[2].split(",").indexOf("none") > -1 ? false : true

            pages = replaceAutonavMacro(contentCatalog, pages, nav, component, version, findModuleMainPage)
        }
    }
    //-------------
    // Evaluate each page line by line and apply the corresponding macro replacement where necessary.
    //-------------
    for (const page of pages) {
        var pageContent = page.contents.toString().split("\n")
        for (const line of pageContent) {
            for (const entry of macrosRegEx) {
                const macro = entry.macro
                const re = entry.re
                const heading = macrosHeadings.find(x => x.macro === macro).heading
                const macroResult = re.exec(line)
                if (macroResult) {
                    var newContent = ""
                    switch (macro) {
                        case "role":
                            pageContent = replaceRoleRelatedMacro(page, pageContent, line, macroResult, heading, rolePageMap, logger)
                            break;
                        case "related":
                            newContent = replaceRelatedMacro(page, pageContent, line, macroResult, heading, keywordPageMap, macrosRegEx)
                            break;
                        case "reference":
                            newContent = replaceReferenceMacro(page, pageContent, line, macroResult, heading, keywordPageMap, macrosRegEx)
                            break;
                        case "pages":
                            newContent = replacePagesMacro(page, pageContent, line, macroResult, heading, pages)
                            break;
                    }
                }
            }
        }
        page.contents = Buffer.from(pageContent.join("\n"))
    }
    return pages

}

module.exports = {
    findAndReplaceCustomASAMMacros
}