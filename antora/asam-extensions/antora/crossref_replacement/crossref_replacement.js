'use strict'
//-------------
//-------------
// Module for replacing local crossrefs to content located on different pages with xref macro.
// This module provides a central function, 'findAndReplaceLocalReferencesToGlobalAnchors', that, if at least one valid anchor was found, parses each adoc file in a component-version-combination.
// It then checks if any unresolved local references are found and tries to replace them with global xrefs.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require("../../core/content_analyzer.js")

/**
 * If a non-empty anchorMap is supplied, this function parses all pages and tries to replace unresolved local links with global xrefs.
 * @param {Object} componentAttributes - An object containing all component attributes.
 * @param {Map <String, Object>} anchorMap - A map of anchors and their page.
 * @param {Array <Object>} pages - An array of pages.
 * @param {String} alternateXrefStyle - (Optional) A string with an alternate xref style when using the xref style replacement.
 * @returns {Array <Object>} The updated array of pages.
 */
function findAndReplaceLocalReferencesToGlobalAnchors( componentAttributes, anchorMap, pages, alternateXrefStyle=null ) {
    if (anchorMap.size === 0) {return pages}
    const re = /<<([^>,]+)(,\s*(.+))?>>/gm
    const reAlt = /xref:[^#\[]+#([^\[]+)\[(([^\]]*))\]/gm
    const reExceptions = /^-{4} *$|^={4} *$|^\/{4} *$|^\+{4} *$|^\.{4} *$|^_{4} *$/gm
    const reIgnoreLine = /^.*\/{2}.*(<<.+>>)|^.*`[^`\n]*(<<.+>>)[^`\n]*`|^.*\/{2}.*(xref:[^#\[]+)#.*|^.*`[^`\n]*(xref:[^#\[]+)#[^`\n]*`/gm
    pages.forEach(page => {
        let content = page.contents.toString()
        let references = [...content.matchAll(re)]
        const referencesAlt = [...content.matchAll(reAlt)]
        if (references.length < 1 ) {references = referencesAlt}
        else if (referencesAlt.length > 0) {references = references.concat(referencesAlt)}
        const exceptions = [...content.matchAll(reExceptions)]
        const ignoreLines = [...content.matchAll(reIgnoreLine)]
        references.forEach(ref => {
            let debug = false
            // if(ref[1] === "sec-ASM-88") {console.log("sec-ASM-88"); debug = true}
            const indexOfPreviousLineBreak = ref.input.slice(0,ref.index).lastIndexOf("\n") + 1
            if (!ignoreLines.filter(x => x[1] === ref[0] || x[2] === ref[0] || x[3] === ref[1] || x[4] === ref[1] ).map(x => x.index).includes(indexOfPreviousLineBreak) && exceptions.filter(x => x.index < ref.index).length % 2 === 0 && anchorMap.get(ref[1])) {
                const val = anchorMap.get(ref[1])
                let referencePage
                if (val.usedIn && val.usedIn.length > 1) {
                    console.log(`Anchor ${ref[1]} used in multiple pages. Cannot determine actual source for local link in page ${page.src.relative}. Using fist valid entry instead...`)
                    referencePage = val.usedIn[0]
                }
                else if (val.usedIn) {
                    referencePage = val.usedIn[0]
                }
                else {
                    referencePage = val.source
                }

                if ( true ) {
                    const tempStyle = componentAttributes.xrefstyle ? componentAttributes.xrefstyle.replace("@","") : ""
                    let autoAltText = ref[1].startsWith("top-") ? "" : ref[1].startsWith("sec-") && alternateXrefStyle && alternateXrefStyle !== "" ? "" : ContentAnalyzer.getReferenceNameFromSource( componentAttributes, anchorMap, pages, referencePage, ref[1], tempStyle )
                    // Workaround in case Section shall also be used on references without numbers
                    // if (ref[1].startsWith("sec-") && alternateXrefStyle && alternateXrefStyle !== "" && referencePage === page) {autoAltText = ContentAnalyzer.getReferenceNameFromSource( componentAttributes, anchorMap, pages, referencePage, ref[1], alternateXrefStyle)}
                    const altText = ref[3] ? ContentAnalyzer.preventLatexMathConversion(ref[3]) : autoAltText
                    const anchorLink = referencePage !== page  || !ref[1].startsWith("top-")? "#" + ref[1] : ""
                    const replacementXref = "xref:" + referencePage.src.version + "@" + referencePage.src.component + ":" + referencePage.src.module + ":" + referencePage.src.relative + anchorLink + "[" + altText + "]"
                    const startIndex = content.indexOf(ref.input.slice(ref.index))
                    content = content.slice(0,startIndex)+content.slice(startIndex).replace(ref[0],replacementXref)
                }
            }
        })
        page.contents = Buffer.from(content)
    })
    return pages
}

module.exports = {
    findAndReplaceLocalReferencesToGlobalAnchors
}
