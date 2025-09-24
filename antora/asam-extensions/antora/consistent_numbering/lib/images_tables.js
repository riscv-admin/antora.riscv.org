'use strict'
//-------------
//-------------
// Sub-extension that provides features for updating image and table counts with attributes.
// The following functions are included:
// * updateImageAndTableIndex
// * addImageOffsetAttributeToPage
// * addTableOffsetAttributeToPage
//
// The updateImageAndTableIndex function is exposed in the module.
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const Helper = require('./helper.js')
const ContentAnalyzer = require("../../../core/content_analyzer.js")
const ContentManipulator = require("../../../core/content_manipulator.js")

// Core function of this feature. Gets the number of images and tables that fulfill the specified ASAM requirements and adds an attribute as offset value.
// Note: This addon requires the Asciidoctor extension "sectnumoffset_antora" to work!
/**
 * Updates a page's index attribute for images and tables.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - An array of pages and partials.
 * @param {Object} page - The current page.
 * @param {Object} componentAttributes - The list of inherited component attributes.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {Object} indices - The current indices
 * @returns {Array <any>} [Updated image index, updated table index, updated code index, updated examples index, number of level 2 sections ]
 */
function updateImageAndTableIndex(mapInput, catalog, page, componentAttributes, navFiles, indices){
    let newImageIndex = indices.imageIndex
    let newTableIndex = indices.tableIndex
    let newCodeIndex = indices.codeIndex
    let newExampleIndex = indices.exampleIndex
    addImageOffsetAttributeToPage(page, newImageIndex)
    addTableOffsetAttributeToPage(page, newTableIndex)
    addCodeOffsetAttributeToPage(page, newCodeIndex)
    addExampleOffsetAttributeToPage(page, newExampleIndex)
    let [numberOfLevelTwoSections, numberOfImages, numberOfTables, numberOfCode, numberOfExamples] = Helper.getIncludedPagesContentForExtensionFeatures(mapInput, catalog.filter(x => x.src.component === page.src.component && x.src.version === page.src.version), page, componentAttributes, navFiles)
    // if (page.src.stem === "entity") {console.log(numberOfImages, numberOfTables, numberOfLevelTwoSections); throw ""}
    newImageIndex += parseInt(numberOfImages)
    newTableIndex += parseInt(numberOfTables)
    newCodeIndex += parseInt(numberOfCode)
    newExampleIndex += parseInt(numberOfExamples)
    return ([newImageIndex,newTableIndex,newCodeIndex,newExampleIndex,numberOfLevelTwoSections])
}

/**
 * Adds an imageoffset attribute to a page with a given value.
 * @param {Object} page - The page the value needs to be applied to.
 * @param {Integer} value - The value that is to be applied as image offset.
 */
function addImageOffsetAttributeToPage( page, value ) {
    let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
    ContentManipulator.addAttributeWithValueToPage(page, newContent, indexOfTitle, "imageoffset", value)
}

/**
 * Adds an tableoffset attribute to a page with a given value.
 * @param {Object} page - The page the value needs to be applied to.
 * @param {Integer} value - The value that is to be applied as table offset.
 */
function addTableOffsetAttributeToPage( page, value ) {
    let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
    ContentManipulator.addAttributeWithValueToPage(page, newContent, indexOfTitle, "tableoffset", value)
}

/**
 * Adds an codeoffset attribute to a page with a given value.
 * @param {Object} page - The page the value needs to be applied to.
 * @param {Integer} value - The value that is to be applied as code offset.
 */
function addCodeOffsetAttributeToPage( page, value ) {
    let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
    ContentManipulator.addAttributeWithValueToPage(page, newContent, indexOfTitle, "codeoffset", value)
}

/**
 * Adds an exampleoffset attribute to a page with a given value.
 * @param {Object} page - The page the value needs to be applied to.
 * @param {Integer} value - The value that is to be applied as example offset.
 */
 function addExampleOffsetAttributeToPage( page, value ) {
    let [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext] = ContentAnalyzer.getPageContentForExtensionFeatures(page)
    ContentManipulator.addAttributeWithValueToPage(page, newContent, indexOfTitle, "exampleoffset", value)
}

module.exports = {
    updateImageAndTableIndex
}