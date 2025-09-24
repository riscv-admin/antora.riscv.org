'use strict'
//-------------
//-------------
// This is a collection of helper functions for the asam_macros extension.
// The following functions are included:
// * excludeNegatedAttributes
// * excludeSelf
// * addNewBulletPoint
// * parseCustomXrefMacro
// * getChildPagesOfPath
//
// All included functions are exposed in the module.
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

/**
 * Excludes all attributes that are negated with an exclamation mark from the provided list of attributes.
 * @param {Set <Object>} exclusionSet - Optional: A set of excluded attributes from a previous function call.
 * @param {String} attributes - A list of attributes extracted for this macro.
 * @param {Map <String, Object>} keywordPageMap - A map of pages associated with all determined keywords.
 * @returns {Set <Object>} The created or updated exclusionSet containing the excluded pages based on the provided negated attributes.
 */
function excludeNegatedAttributes( exclusionSet = new Set(), attributes, keywordPageMap ) {
    const attributesArray = attributes.split(",").filter(attr => attr.trim().startsWith("!"))
    for (let attr of attributesArray) {
        let attrPage;
        attr = attr.slice(1)
        if (keywordPageMap.has(attr)) {
            attrPage = keywordPageMap.get(attr)
            exclusionSet = new Set([...exclusionSet,...attrPage])
        }
    }
    return (exclusionSet)
}

/**
 * Excludes the page for which the function was triggered.
 * @param {Object} page - The page where the macro was found in.
 * @param {Set <Object>} exclusionSet - Optional: A set of excluded attributes from a previous function call.
 * @returns {Set <Object>} The created or updated exclusionSet containing the excluded pages based on the provided negated attributes.
 */
function excludeSelf( page, exclusionSet = new Set() ) {
    exclusionSet.add(page)
    return exclusionSet
}

/**
 * Adds a new bullet point in front of the provided content.
 * @param {String} content - The string (content) that is to be turned into a bullet point
 * @returns {String} The updated string.
 */
function addNewBulletPoint( content ) {
    return "* ".concat(content)
}

/**
 * Parses the result from the regular expression and converts them into a standardized object. Additionally, it creates the suggested start for the new line based on the parsed line and the provided heading.
 * @param {Array <any>} macroResult - Result from a regular expression with [1]: attributes and [2]: parameters.
 * @param {String} line - The line for which the regular expression matched.
 * @param {String} heading - Optional: A heading for the first new line that replaces the custom macro.
 * @returns {Object} The compiled object with .attributes, .parameters, .indexStart, .indexStop, and .newLine.
 */
function parseCustomXrefMacro( macroResult, line, heading="" ) {
    var resultValues = new Object;
    resultValues.attributes = macroResult[1]
    resultValues.parameters = macroResult[2]
    resultValues.indexStart = macroResult.index
    resultValues.indexStop = line.indexOf("]",resultValues.indexStart) +1
    const newLine = line.substring(0,resultValues.indexStart) + heading + " "+ line.substring(resultValues.indexStop)
    resultValues.newLine = newLine
    return resultValues
}

/**
 * Determines all pages for a given directory. With doAll=true, traverses through all sub-directories as well.
 * @param {Array <Object>} pages - The list of all pages that should be considered. May be the complete list of pages for a component-version-combination.
 * @param {String} path - The path at which the function shall start looking for child pages.
 * @param {Boolean} doAll - Optional: If true, makes the function traverse through all sub-directories as well.
 * @returns {Array <Object>} The found child pages, if any.
 */
function getChildPagesOfPath( pages, path, doAll=false ) {
    var childPages = new Array();
    if (doAll) {
        pages.forEach((page) => {
            if (page.dirname.indexOf(path) >-1) {
                childPages.push(page)
            }
        })
    }
    else {
        pages.forEach((page) => {
            if (page.dirname === path) {
                childPages.push(page)
            }
        })
    }
    return (childPages);
}


module.exports = {
    excludeNegatedAttributes,
    excludeSelf,
    addNewBulletPoint,
    parseCustomXrefMacro,
    getChildPagesOfPath
}