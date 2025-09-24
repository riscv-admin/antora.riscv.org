'use strict'
//-------------
//-------------
// Module for generating a page containing an overview over keywords and the pages they are used in.
// This module provides a central function, 'createKeywordsOverviewPage', that creates a new page with alphabetically sorted keywords as sections and the respective pages as xref bullet points below them.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

const FileCreator = require("../../core/file_creator.js")

/**
 * Creates an overview page from a provided map where each keywords is added as a level 3 section and the associated pages as xrefs.
 * @param {Boolean} keywordOverviewPageRequested - Only execute if set to true. Otherwise, return the unchanged array of pages.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Map <String, Object>} keywordPageMap - A map of keywords and the pages they occur in.
 * @param {String} targetPath - The path at which the created file will be located.
 * @param {String} targetName - The name the created file will have.
 * @param {String} targetModule - The module in which the created file will be located.
 * @param {String} component - The current component.
 * @param {String} version - The current version
 * @returns {Array <Object>} The (updated) array of pages.
 */
function createKeywordsOverviewPage( keywordOverviewPageRequested, contentCatalog, pages, keywordPageMap, targetPath, targetName, targetModule, component, version ) {
    if (!keywordOverviewPageRequested) {
        return pages
    }
    //-------------
    // The default content of the new file's body.
    //-------------
    const standardContent = new Array(
        "= Used keywords",
        ":description: Automatically generated overview over all keywords.",
        ":keywords: generated,keywords,keyword-overview-page,link-concept,structure",
        ":page-partial:",
        "",
        "This page is an automatically generated list of all keywords.",
        "Every keyword has its own subsection and contains a link to each page as well as the original filename, path and module in the repository.",
        "",
        "== List of keywords",
        ""
    )
    let myBase;
    for (let entry of [...keywordPageMap.entries()].sort()) {
        let val = entry[1].entries().next().value[0]
        myBase = val.base
        if (targetPath !== "" && !targetPath.endsWith("/")){
            targetPath = targetPath+"/"
        }
        if (entry[1].size === 1 && val.src.relative === targetPath+targetName && val.src.module === targetModule) {
            continue;
        }
        standardContent.push("=== "+entry[0])
        for (let value of entry[1]) {
            if (value.src.basename === targetName && value.src.relative === targetPath && value.src.module === targetModule) {
                continue;
            }
            standardContent.push("* xref:"+value.src.module+":"+value.src.relative+"[]")
        }
        standardContent.push("")
    }
    const relative = targetPath === "" ? targetName : targetPath+"/"+targetName
    //-------------
    // If a file with the target name already exists, replace its content with the created body.
    // Otherwise, create a new virtual file.
    //-------------
    let existingFile = contentCatalog.findBy({component: component, version: version, module: targetModule, relative: relative})
    if (existingFile.length) {
        existingFile[0].contents = Buffer.from(standardContent.join("\n"))
        return pages
    }
    else {
        let newFile = FileCreator.createNewVirtualFile(contentCatalog, targetName, targetPath, targetModule, component, version, standardContent.join("\n"),myBase)
        return [...pages,newFile]
    }
}

module.exports = {
    createKeywordsOverviewPage
}