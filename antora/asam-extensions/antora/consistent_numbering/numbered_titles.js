'use strict'
//-------------
//-------------
// Module for the consistent numbering extension.
// This module provides a central function, 'applySectionAndTitleNumbers', that parses each adoc file in a component-version-combination and determines the relevant section, image, and table offset using the page order in the navigation file.
// Note 1: This addon requires the Asciidoctor extension "sectnumoffset_antora" to work!
// Note 2: This addon also requires the Asciidoctor extension "sectnums_to_iso" when using the iso style numeration.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const Helper = require('./lib/helper.js')
const ImgTab = require('./lib/images_tables.js')
const ContentAnalyzer = require('../../core/content_analyzer.js')
const ContentManipulator = require('../../core/content_manipulator.js')

/**
 * Determines and applies consistent and consecutive numbers for page titles, sections, ASAM-style images, and ASAM-style tables.
 * This also applies section roles such as "appendix", "bibliography", and "preface". Not all roles are currently supported yet, however!
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - An array of pages and partials for all component-version-combination.
 * @param {Array <Object>} pages - An array of pages for a given component-version-combination.
 * @param {Array <Object>} navFiles - An array of navigation files for a given component-version-combination.
 * @param {String} sectionNumberStyle - The selected style for section numbers. If "iso", the trailing "." is dropped.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {String} component - The current component.
 * @param {String} version - The current version.
 */
function applySectionAndTitleNumbers (mapInput, catalog, pages, navFiles, sectionNumberStyle, contentCatalog, component, version) {
    const style = sectionNumberStyle ? sectionNumberStyle.toLowerCase() : "default"
    //-------------
    // Determine the appendix caption and the standard offset for the appendix to be used.
    //-------------
    const componentAttributes = contentCatalog.getComponents().filter(x => x.name === component)[0].versions.filter(x => x.version === version)[0].asciidoc.attributes
    const appendixCaption = Object.keys(componentAttributes).indexOf("appendix-caption") > -1 ? componentAttributes["appendix-caption"] : "Appendix"
    let appendixOffset = Object.keys(componentAttributes).indexOf("appendix-offset") > -1 ? componentAttributes["appendix-offset"] : 0
    //-------------
    // Sort nav files by index and the process them in order, then generate consistent numbers accordingly.
    //-------------
    navFiles.sort((a,b) => {
        return a.nav.index - b.nav.index
    })
    generateConsistentNumbersBasedOnNavigation(mapInput, catalog, pages, componentAttributes, navFiles, style, appendixCaption, appendixOffset)
}

/**
 * Create consistent numbering based on ordered navigation files.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Array <Object>} navFiles - A sorted array of navigation files.
 * @param {String} style - The selected style. If "iso", drop the trailing ".".
 * @param {String} appendixCaption - The caption for appendices.
 * @param {Integer} appendixOffset - An offset value for appendices, if an appendix needs to start with a different letter than "A".
 */
function generateConsistentNumbersBasedOnNavigation(mapInput, catalog, pages, componentAttributes, navFiles, style, appendixCaption, appendixOffset) {
    const reStartLevel = /:start-level: ([0-9]*)/;
    const reResetLevelOffset = /:reset-level-offset:/;
    let currentRole = "default"
    let generateNumbers = true
    let chapterIndex = Helper.setStartingChapterIndex(style,"0")
    let indices = {chapterIndex: chapterIndex, imageIndex: 0, tableIndex: 0, exampleIndex: 0, codeIndex: 0}
    //-------------
    // Iterate over all (sorted) navigation files.
    //-------------
    navFiles.forEach(nav => {
        //-------------
        // Read and interpret the navigation file content
        //-------------
        const navContentSum = nav._contents.toString()
        let content = navContentSum.split("\n")
        if (navContentSum.match(reResetLevelOffset)) {
            chapterIndex = Helper.setStartingChapterIndex(style,"0")
            indices = {chapterIndex: chapterIndex, imageIndex: 0, tableIndex: 0, exampleIndex: 0, codeIndex: 0}
        }
        //-------------
        // Check if the start-level attribute was set and, if so, use its value as an offset
        //-------------
        let startLevel = navContentSum.match(reStartLevel) && navContentSum.match(reStartLevel)[1] ? navContentSum.match(reStartLevel)[1] : 1
        for (let line of nav._contents.toString().split("\n")) {
            //---
            //workaround!!! TODO: replace
            //
            indices.exampleIndex = 0
            //-------------
            // Check if the line contains a role or the sectnums attribute
            //-------------
            let hasChanged = false;
            [generateNumbers, content, hasChanged] = Helper.checkForSectnumsAttribute(content,line,generateNumbers)
            if (hasChanged) {continue;}
            [currentRole, content, hasChanged] = Helper.checkForRoleInLine(content, line, currentRole)
            if (hasChanged) {continue;}
            line = ContentAnalyzer.replaceAllAttributesInLine(componentAttributes,{},line)

            if (line.startsWith("//")){content[content.indexOf(line)]="";  continue;}
            //-------------
            // If the line contains no role or the sectnums attribute, apply the currently valid role to it.
            // Currently not supported roles are "abstract", "glossary", and "index".
            //-------------
            switch (currentRole) {
                case "abstract":
                    currentRole = "default";
                    break;
                case "appendix":
                    [content, generateNumbers,currentRole] = handleAppendix(mapInput, nav, catalog,  pages, componentAttributes, navFiles, content, line, generateNumbers, startLevel, indices, style, appendixCaption, appendixOffset);
                    break;
                case "glossary":
                    currentRole = "default";
                    break;
                case "bibliography":
                    currentRole = handleBibliography(mapInput, nav, catalog, pages, componentAttributes, navFiles, line, indices)
                    break;
                case "index":
                    currentRole = "default";
                    break;
                case "preface":
                    currentRole  = handlePreface(mapInput, nav, catalog, pages, componentAttributes, navFiles, line, indices)
                    break;
                case "default":
                    [content, generateNumbers,currentRole] = tryApplyingPageAndSectionNumberValuesToPage(mapInput, nav, catalog, pages, componentAttributes, navFiles, content, line, generateNumbers, startLevel, indices, style)
                    break;
            }
        }
        //-------------
        // After having executed on all lines, write the changes back to the navigation file.
        //-------------
        nav._contents = Buffer.from(content.join("\n"))
    })
}

/**
 * Apply section numbers to a page declared as "preface". Resets to "default" afterwards.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Object} nav - The navigation file.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {String} line - The next valid line after the role "preface" was declared.
 * @param {Object} indices - The current indices.
 * @returns {String} The new role "default"
 */
function handlePreface (mapInput, nav, catalog, pages, componentAttributes, navFiles, line, indices ) {
    const indexOfXref = line.indexOf("xref:")
    let page = ContentAnalyzer.determinePageForXrefInLine(line, indexOfXref, pages, nav)[0]
    if (!page) {
        return "default"
    }
    Helper.unsetSectnumsAttributeInFile(page)
    let [newImageIndex,newTableIndex,newCodeIndex,newExampleIndex,newLevelTwoSections] = ImgTab.updateImageAndTableIndex(mapInput, catalog, page, componentAttributes, navFiles, indices)
    indices.imageIndex = newImageIndex
    indices.tableIndex = newTableIndex
    indices.codeIndex = newCodeIndex
    indices.exampleIndex = newExampleIndex
    ContentManipulator.addSpecialSectionTypeToPage(page, "preface")
    return "default"
}

/**
 * Apply section numbers to a page declared as "preface". Resets to "default" afterwards.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Object} nav - The navigation file.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {Array <String>} content - The content of the navigation file.
 * @param {String} line - The next valid line after the role "preface" was declared.
 * @param {Boolean} generateNumbers - Defines if sectnums are allowed.
 * @param {Integer} startLevel - The section level at which to start, depending on the level of the line in the bullet point list.
 * @param {Object} indices - The current indices (chapter, image, table, etc.).
 * @param {String} style - The selected style. If "iso", drop the trailing ".".
 * @param {String} appendixCaption - The caption for appendices.
 * @param {Integer} appendixOffset - An offset value for appendices, if an appendix needs to start with a different letter than "A".
 * @returns {Array <any>} [new role, generateNumbers, new option]
 */
function handleAppendix( mapInput, nav, catalog, pages, componentAttributes, navFiles, content, line, generateNumbers, startLevel, indices, style, appendixCaption, appendixOffset ) {
    const appendixStartLevel = isNaN(parseInt(startLevel)+parseInt(appendixOffset)) ? startLevel : (parseInt(startLevel)+parseInt(appendixOffset)).toString()
    return tryApplyingPageAndSectionNumberValuesToPage(mapInput, nav, catalog, pages, componentAttributes, navFiles, content, line, generateNumbers, appendixStartLevel, indices, style, "appendix", appendixCaption, true)
}

/**
 * Apply section numbers to a page declared as "bibliography". Resets to "default" afterwards.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Object} nav - The navigation file.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {String} line - The next valid line after the role "preface" was declared.
 * @param {Object} indices - The current indices.
 * @returns {String} The new role "default"
 */
function handleBibliography(mapInput, nav, catalog, pages, componentAttributes, navFiles, line, indices) {
    const indexOfXref = line.indexOf("xref:")
    let bibliographyPage = ContentAnalyzer.determinePageForXrefInLine(line, indexOfXref, pages, nav)
    let page = bibliographyPage[0]
    if (!page) {
        return "default"
    }
    Helper.unsetSectnumsAttributeInFile(page)
    let [newImageIndex,newTableIndex,newCodeIndex,newExampleIndex,newLevelTwoSections] = ImgTab.updateImageAndTableIndex(mapInput, catalog, page, componentAttributes, navFiles, indices)
    indices.imageIndex = newImageIndex
    indices.tableIndex = newTableIndex
    indices.codeIndex = newCodeIndex
    indices.exampleIndex = newExampleIndex
    ContentManipulator.addSpecialSectionTypeToPage(page, "bibliography")
    return "default"
}

/**
 * Default function for applying consistent and consecutive numbers to a page or a non-page entry in a navigation file.
 * Analyze the given line and parse page, if applicable.
 * Determine level 2 sections, number of valid figures and tables, and apply offsets, if current page and navigation role/settings allows numbering.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Object} nav - The navigation file.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {Array <String>} content - The content of the navigation file.
 * @param {String} line - The next valid line after the role "preface" was declared.
 * @param {Boolean} generateNumbers - Defines if sectnums are allowed.
 * @param {Integer} startLevel - The section level at which to start, depending on the level of the line in the bullet point list.
 * @param {Object} indices - The current indices.
 * @param {String} style - The selected style. If "iso", drop the trailing ".".
 * @param {String} option - Optional: If set to anything but "default", the option will be added as page role at the top of the page.
 * @param {String} appendixCaption - Optional: The caption for appendices. Only relevant for appendix pages.
 * @param {Boolean} isAppendix - Optional: If true, activates the features reserved for appendices.
 * @returns {Array <any>} [Changed content, generateNumbers = true, new option]
 */
function tryApplyingPageAndSectionNumberValuesToPage( mapInput, nav, catalog, pages, componentAttributes, navFiles, content, line, generateNumbers, startLevel, indices, style, option="default", appendixCaption="", isAppendix = false ) {
    let newImageIndex = indices.imageIndex
    let newTableIndex = indices.tableIndex
    let newCodeIndex = indices.codeIndex
    let newExampleIndex = indices.exampleIndex
    let chapterIndex = indices.chapterIndex
    let numberOfLevelTwoSections = 0
    const indexOfXref = line.indexOf("xref:")
    //-------------
    // Determine the current level by counting the bullet points in this line, then deduct the startlevel offset.
    //-------------
    const level = indexOfXref > 0 ? line.lastIndexOf("*",indexOfXref) + 1 : line.lastIndexOf("*") + 1
    const targetLevel = level - startLevel + 1
    if (indexOfXref > 0 || level >= startLevel) {
        //-------------
        // Execute if no xref was found (i.e. the line contains only a list entry without link).
        // Get the next chapter number (current + 1, depending on previous and current bulletpoint level), then change the line in the navigation file and apply the correct style.
        //-------------
        if (indexOfXref <= 0) {
            if (!generateNumbers) {
                return [content, !generateNumbers,"default"]
            }
            const reservedContent = content.slice(0, content.indexOf(line)).reverse().join("\n")
            const appendixTypeInNav = ContentAnalyzer.getAttributeFromContent(reservedContent, 'appendix-type')
            const appendixType = appendixTypeInNav ? ` (${appendixTypeInNav.trim()})` : componentAttributes['appendix-type'] ? ` (${componentAttributes['appendix-type'].trim()})` : ""
            chapterIndex = Helper.determineNextChapterIndex(targetLevel, chapterIndex, style, appendixCaption, isAppendix)
            const changedLine = isAppendix && targetLevel === 1 ? line.slice(0,level) + " " + appendixCaption + " " + chapterIndex + appendixType + ":" + line.slice(level) : line.slice(0,level) + " " + chapterIndex + line.slice(level)
            content[content.indexOf(line)] = changedLine
            chapterIndex = style === "iso" ? chapterIndex +"."+ 0 : chapterIndex + 0 +"."
        }
        //-------------
        // Execute if xref was found (i.e. the line contains a link to a file).
        // Get the referenced page, if the link is correct.
        //-------------
        else if (level >= startLevel) {
            let foundPage = ContentAnalyzer.determinePageForXrefInLine(line, indexOfXref, pages, nav)
            //-------------
            // Only execute if at least one matching page was found. If so, take the first page that matches.
            //-------------
            if (foundPage.length > 0) {
                let page = foundPage[0]
                if (!generateNumbers) {
                    Helper.unsetSectnumsAttributeInFile(page)
                    let [updateImageIndex,updateTableIndex,updateCodeIndex,updateExampleIndex,newLevelTwoSections] = ImgTab.updateImageAndTableIndex(mapInput, catalog, page, componentAttributes, navFiles, indices)
                    indices.chapterIndex = chapterIndex
                    indices.imageIndex = updateImageIndex
                    indices.tableIndex = updateTableIndex
                    indices.codeIndex = updateCodeIndex
                    indices.exampleIndex = updateExampleIndex
                    return [content, !generateNumbers, "default"]
                }
                //-------------
                // If section number shall be applied, apply current values and determine the next ones.
                //-------------
                chapterIndex = Helper.determineNextChapterIndex(targetLevel, chapterIndex, style, appendixCaption, isAppendix)
                Helper.addTitleoffsetAttributeToPage( page, chapterIndex)
                let [updateImageIndex,updateTableIndex,updateCodeIndex,updateExampleIndex,newLevelTwoSections] = ImgTab.updateImageAndTableIndex(mapInput, catalog, page, componentAttributes, navFiles, indices)
                newImageIndex = updateImageIndex
                newTableIndex = updateTableIndex
                newCodeIndex = updateCodeIndex
                newExampleIndex = updateExampleIndex
                numberOfLevelTwoSections = newLevelTwoSections
                let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
                const targetIndex = style === "iso" ? chapterIndex.split(".") : chapterIndex.split(".").slice(0,-1)
                let appendixTypeString = ""
                if (isAppendix && targetLevel === 1) {
                    const appendixType = ContentAnalyzer.getAttributeFromFile(page, 'appendix-type', 20) ? ContentAnalyzer.getAttributeFromFile(page, 'appendix-type', 20).trim() : componentAttributes['appendix-type'] ? componentAttributes['appendix-type'].trim() : null
                    appendixTypeString = appendixType ? ` (${appendixType})` : ""
                    newContent.splice(indexOfTitle+2, 0, ":titleprefix: " + appendixCaption + " " + targetIndex.join(".") + appendixTypeString + ":")
                }
                //-------------
                // If the option is passed in this function (e.g. as "appendix") and the value is not "default", it is added above the title.
                // With this, the page is marked as type [option].
                //-------------
                if (option !== "default") {
                    newContent.splice(0,0,"["+option+"]")
                    option = "default"
                }
                page._contents = Buffer.from(newContent.join("\n"))
                //-------------
                // Define the reftext attributes for each xrefstyle for the reference_style_mixing extension.
                //-------------
                let title = page.contents.toString().match(/^= (.*)$/m) ? page.contents.toString().match(/^= (.*)$/m)[1].trim() : ""
                const sectionRefsig = componentAttributes['section-refsig'] ? componentAttributes['section-refsig'] : "Section"
                const reftext_full = isNaN(targetIndex[0]) ? `${appendixCaption} ${targetIndex.join(".")}, __${title}__` : `${sectionRefsig} ${targetIndex.join(".")}, "${title}"`
                const reftext_short = isNaN(targetIndex[0]) ? `${appendixCaption} ${targetIndex.join(".")}` : `${sectionRefsig} ${targetIndex.join(".")}`
                const reftext_basic = isNaN(targetIndex[0]) ? `__${title}__` : `"${title}"`
                const navtitle = (isAppendix && targetLevel === 1) ? `${appendixCaption} ${targetIndex.join(".")}${appendixTypeString}: ${title}` :  `${targetIndex.join(".")} ${title}`
                ContentManipulator.updateAttributeWithValueOnPage(page, "navtitle", navtitle)
                ContentManipulator.updateAttributeWithValueOnPage(page, "reftext_full", reftext_full)
                ContentManipulator.updateAttributeWithValueOnPage(page, "reftext_short", reftext_short)
                ContentManipulator.updateAttributeWithValueOnPage(page, "reftext_basic", reftext_basic)
                // if (reftext_full.includes("Annex B")) {console.log(ContentAnalyzer.getAttributeFromContent(page.contents.toString(),"reftext_full")); throw "$$$"}
                const newIndex = style === "iso" ? chapterIndex +"."+ (numberOfLevelTwoSections-1) : chapterIndex + (numberOfLevelTwoSections-1) +"."
                chapterIndex = Helper.determineNextChapterIndex(targetLevel+1, newIndex, style, appendixCaption, isAppendix)
            }
        }
    }
    indices.chapterIndex = chapterIndex
    indices.imageIndex = newImageIndex
    indices.tableIndex = newTableIndex
    indices.codeIndex = newCodeIndex
    indices.exampleIndex = newExampleIndex
    return [content, generateNumbers, option]
}

module.exports = {
    applySectionAndTitleNumbers
}