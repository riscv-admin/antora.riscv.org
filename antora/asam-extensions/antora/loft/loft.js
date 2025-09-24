'use strict'
//-------------
//-------------
// Module for creating or updating a page for each a list of figures and a list of tables.
// This module provides a central function, 'createLoft', that creates these two files.
// For each file, if it already exists, its content is instead overwritten. Otherwise, a new virtual file is created at the defined location.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require('../../core/content_analyzer.js')
const FileCreator = require('../../core/file_creator.js')

/**
 * Creates or updates the pages "list_of_figures.adoc" and "list_of_tables.adoc" and adds the respective list of valid figures/tables to it.
 * A "valid" entry is one where the anchor is set according to the ASAM specification and where a title for the entry is set.
 * @param {Object} componentAttributes - The attributes set for the component.
 * @param {Object} contentCatalog - The content catalog as provided by Antora.
 * @param {Map <String, Object>} anchorPageMap - A map containing all anchors.
 * @param {Array <Object>} navFiles - A list of all navigation files for this component-version combination.
 * @param {Array <Object>} catalog - An array of all pages and partials of this component-version combination.
 * @param {String} component - The current component.
 * @param {String} version - The current version.
 */
function createLoft(componentAttributes, contentCatalog, anchorPageMap, navFiles, catalog, component, version) {
    if (!anchorPageMap || anchorPageMap.length === 0){console.log("anchorPageMap is empty -- cannot create LOFT"); return}
    let mergedNavContents = []
    navFiles.sort((a,b) => {
        return a.nav.index - b.nav.index
    })
    if (!navFiles || navFiles.length === 0) {return}
    const targetModule = navFiles.at(-1).src.module
    for (let nav of navFiles) {
        const newNavContent = nav.contents.toString().split("\n")
        mergedNavContents = mergedNavContents.concat(newNavContent)
    }
    mergedNavContents = mergedNavContents.join("\n")
    const figureMap = new Map([...anchorPageMap].filter(([k,v]) => k.startsWith("fig-")))
    const figureArray = createSortedArrayFromMap(figureMap, mergedNavContents)
    const tableMap = new Map([...anchorPageMap].filter(([k,v]) => k.startsWith("tab-")))
    const tableArray = createSortedArrayFromMap(tableMap, mergedNavContents)
    // let figuresPage = createListOfFiguresPage(componentAttributes, contentCatalog, catalog, figureMap, targetModule, component, version)

    // let tablesPage = createListOfTablesPage(componentAttributes, contentCatalog, catalog, tableMap, targetModule, component, version)

    if (figureArray && figureArray.length > 0){
        let figuresPage = createListOfFiguresPage(componentAttributes, contentCatalog, catalog, figureMap, figureArray, targetModule, component, version)
        if (figuresPage) {
            navFiles.at(-1).contents = Buffer.from(navFiles.at(-1).contents.toString().concat("\n",`* xref:${figuresPage.src.relative}[]\n`))
        }
    }

    if (tableArray && tableArray.length > 0){
        let tablesPage = createListOfTablesPage(componentAttributes, contentCatalog, catalog, tableMap, tableArray, targetModule, component, version)
        if (tablesPage) {
            navFiles.at(-1).contents = Buffer.from(navFiles.at(-1).contents.toString().concat("\n",`* xref:${tablesPage.src.relative}[]\n`))
        }
    }

}

/**
 * Analyzes an anchor map and converts it to a sorted array, where each anchor-page combination has its own entry.
 * @param {Map <String, Object>} inputMap - The map that is to be converted.
 * @param {String} mergedNavContents - The merged contents of all relevant navigation files.
 * @returns {Array <Object>} {anchor, page, source, line}
 */
function createSortedArrayFromMap(inputMap, mergedNavContents) {
    let newArray = []
    for (let entry of inputMap.keys()) {
        if (inputMap.get(entry).usedIn.length > 1) {
            for (let p of inputMap.get(entry).usedIn) {
                if(p.src.family === "partial") {
                    continue;
                }
                const index = inputMap.get(entry).usedIn.indexOf(p)
                newArray.push({anchor:entry, page:p, source:inputMap.get(entry).source, line:inputMap.get(entry).usedInLine[index]})
            }
        }
        else {
            newArray.push({anchor:entry, page:inputMap.get(entry).source, source:inputMap.get(entry).source, line: inputMap.get(entry).line})
        }
    }
    newArray = newArray.filter(entry => (entry.page.out && mergedNavContents.indexOf(entry.page.src.relative) > -1))

    newArray.sort((a,b) => {
        let indexA = mergedNavContents.indexOf(a.page.src.relative)
        let indexB = mergedNavContents.indexOf(b.page.src.relative)

        if (indexA === indexB) {
            indexA = parseInt(a.line)
            indexB = parseInt(b.line)
        }
        return indexA - indexB
    })

    return newArray
}

/**
 * Creates a new or updates an existing list_of_figures page with a table containing all found figure anchors and their first occurrence.
 * @param {Object} componentAttributes - The attributes set for the component.
 * @param {Object} contentCatalog - The content catalog as provided by Antora.
 * @param {Array <Object>} catalog - An array of all pages and partials of this component-version combination.
 * @param {Map <String, Object>} figureMap - A map containing all figure anchors.
 * @param {Array <Object>} figureArray - A sorted array created from the figureMap.
 * @param {String} targetModule - The determined target module for the new/updated file.
 * @param {String} component - The current component.
 * @param {String} version - The current version.
 * @returns {*} The new virtual file, if created. If no file is created, returns null instead.
 */
 function createListOfFiguresPage( componentAttributes, contentCatalog, catalog, figureMap, figureArray, targetModule, component, version ){
    if (!figureMap || figureMap.length === 0) {return null;}
    let newContent = ['= List of figures']
    newContent.push('')
    newContent.push('[%header, cols="12,88", grid=none, frame=none]')
    newContent.push('|===')
    newContent.push('|Figure      |Description')
    let entryIndex = 1
    const base = figureMap.entries().next().value[1].source.base
    for (let entry of figureArray) {
        const page = entry.page
        const anchor = entry.anchor
        const srcModule = page.src.module
        const path = page.src.relative
        const src = entry.source
        let title = ContentAnalyzer.getReferenceNameFromSource(componentAttributes, figureMap, catalog, src, anchor)
        // title = replaceXrefsInTitleLink(title)

        if (title !== "") {
            // newContent.push(`|Figure ${entryIndex}:  |xref:${srcModule}:${path}#${anchor}[${title}]`)
            newContent.push(`|xref:${srcModule}:${path}#${anchor}[Figure ${entryIndex}]  |${title}`)
            entryIndex += 1
        }
    }
    newContent.push("|===")
    let targetPage = catalog.find(x => x.src.relative === "loft/list_of_figures.adoc")
    if (targetPage) {
        targetPage.contents = Buffer.from(newContent.join("\n"))
        return null;
    }
    return (FileCreator.createNewVirtualFile(contentCatalog, "list_of_figures.adoc", "loft", targetModule, component, version, newContent.join("\n"), base))
}

/**
 * Creates a new or updates an existing list_of_tables page with a table containing all found table anchors and their first occurrence.
 * @param {Object} componentAttributes - The attributes set for the component.
 * @param {Object} contentCatalog - The content catalog as provided by Antora.
 * @param {Array <Object>} catalog - An array of all pages and partials of this component-version combination.
 * @param {Map <String, Object>} tableMap - A map containing all table anchors.
 * @param {Array <Object>} tableArray - A sorted array created from the tableMap.
 * @param {String} targetModule - The determined target module for the new/updated file.
 * @param {String} component - The current component.
 * @param {String} version - The current version.
 * @returns {*} The new virtual file, if created. If no file is created, returns null instead.
 */
 function createListOfTablesPage( componentAttributes, contentCatalog, catalog, tableMap, tableArray, targetModule, component, version ){
    if (!tableMap || tableMap.length === 0) {return null;}
    let newContent = ['= List of tables']
    newContent.push('')
    newContent.push('[%header, cols="12,88", grid=none, frame=none]')
    newContent.push('|===')
    newContent.push('|Table      |Description')
    let entryIndex = 1
    const base = tableMap.entries().next().value[1].source.base
    for (let entry of tableArray) {
        const page = entry.page
        const anchor = entry.anchor
        const srcModule = page.src.module
        const path = page.src.relative
        const src = entry.source
        let title = ContentAnalyzer.getReferenceNameFromSource(componentAttributes, tableMap, catalog, src, anchor)
        // title = replaceXrefsInTitleLink(title)

        if (title !== "") {
            // newContent.push(`|Table ${entryIndex}:  |xref:${srcModule}:${path}#${anchor}[${title}]`)
            newContent.push(`|xref:${srcModule}:${path}#${anchor}[Table ${entryIndex}]  |${title}`)
            entryIndex += 1
        }
    }
    newContent.push("|===")
    let targetPage = catalog.find(x => x.src.relative === "loft/list_of_tables.adoc")
    if (targetPage) {
        targetPage.contents = Buffer.from(newContent.join("\n"))
        return null;
    }
    return (FileCreator.createNewVirtualFile(contentCatalog, "list_of_tables.adoc", "loft", targetModule, component, version, newContent.join("\n"), base))
}

/**
 * Replaces an xref macro with title attribute with the value of said title attribute (for use inside another xref).
 * @param {String} titleText - A string where the xref macro needs to be replaced with its title attribute.
 * @returns {String} The updated title.
 */
function replaceXrefsInTitleLink(titleText) {
    const re = /(xref:[^\[]+\[(.*)\])/m
    const match = titleText.match(re)
    if (match) {
        let newTitleText = titleText.replace(match[1], match[2])
        return newTitleText
    }
    else {
        return titleText
    }
}

module.exports = {
    createLoft
}