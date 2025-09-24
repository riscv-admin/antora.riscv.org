'use strict'
//-------------
//-------------
// Core module for changing content on a page.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require('./content_analyzer.js')

/**
 * Adds an attribute with a value to a page.
 * @param {Object} page - The page where the attribute is to be added to.
 * @param {Array <String>} pageContent - The page's content.
 * @param {Integer} indexOfTitle - The determined index of the line of the title.
 * @param {String} attribute - The attribute that is to be added.
 * @param {*} value - The value of the new attribute.
 * @param {Boolean} unset - Optional: If true, the attribute is added without value and unset by adding an '!' at the end.
 */
function addAttributeWithValueToPage( page, pageContent, indexOfTitle, attribute, value, unset=false ) {
    const attr = unset ? ":"+attribute+"!: "+value : ":"+attribute+": "+value.toString()
    pageContent.splice(indexOfTitle+1,0,attr+"\r")
    page.contents = Buffer.from(pageContent.join("\n"))
}

/**
 * Updates an existing attribute value (first from the top) or, if not found, adds it.
 * @param {Object} page - The page on which an attribute has to be set or updated.
 * @param {String} attribute - The attribute that needs to be set or updated.
 * @param {*} value - The new value of the attribute
 */
function updateAttributeWithValueOnPage( page, attribute, value) {
    let content = page.contents.toString().split("\n")
    let foundMatch = false
    for (let [index, line] of content.entries()) {
        let m
        if (m = line.match(new RegExp(`^\s*:${attribute}:(.*)`))) {
            // const index = content.indexOf(line)
            line = line.replace(m[1], ` ${value}`)
            content[index] = line
            page.contents = Buffer.from(content.join("\n"))
            foundMatch = true
            break;
        }
    }

    if (!foundMatch) {
        const [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
        addAttributeWithValueToPage( page, newContent, indexOfTitle, attribute, value)
    }
}

/**
 * Adds a section role (special section type) to a page.
 * @param {Object} page - The page the role is to be added to.
 * @param {String} specialSectionType - The role name.
 */
function addSpecialSectionTypeToPage( page, specialSectionType ){
    let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
    newContent.splice(indexOfTitle+1,0,"["+specialSectionType+"]")
    page.contents = Buffer.from(newContent.join("\n"))
}


module.exports = {
    addAttributeWithValueToPage,
    addSpecialSectionTypeToPage,
    updateAttributeWithValueOnPage
}