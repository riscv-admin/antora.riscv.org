'use strict'
//-------------
//-------------
// Module for adding explicit xref styles to certain xrefs.
// This module provides a central function, 'addXrefStyleToSectionAndPageXrefs'.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

const ContentAnalyzer = require("../../core/content_analyzer.js")
const ContentManipulator = require("../../core/content_manipulator.js")

var anchorErrors = []

/**
 * Applies an alternate xref style to section and page xrefs for all pages and partials.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - The filtered content catalog for the current component-version combination.
 * @param {Object} componentAttributes - The attributes of the component.
 * @param {Map <String, Object>} anchorPageMap - A map containing anchors and their associated pages.
 * @param {String} style - The chosen xref style. Valid values: "full", "short", and "basic".
 */
function addXrefStyleToSectionAndPageXrefs(mapInput, catalog, componentAttributes, anchorPageMap, style) {
    const appendixCaption = Object.keys(componentAttributes).indexOf("appendix-caption") > -1 ? componentAttributes["appendix-caption"] : "Appendix"
    // const pages = catalog.filter(x => x.src.family === "page")
    const pages = catalog.filter(x => (x.src.mediaType === "text/asciidoc" && (x.src.family === "page" || x.src.family === "partial")))
    switch (style) {
        case 'full':
        case 'short':
        case 'basic':
            pages.forEach((page) => {
                // console.log("Check c", page.src.abspath)
                applyXrefStyle(mapInput, catalog, componentAttributes, anchorPageMap, page, style, appendixCaption)
            })
            break;
        default:
            console.warn("ERROR - invalid xref style selected. No changes will be applied!");
            break;
    }
}

/**
 * Applies a chosen xref style to all xrefs found in a given page.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - The filtered content catalog for the current component-version combination.
 * @param {Object} componentAttributes - The attributes of the component.
 * @param {Map <String, Object>} anchorPageMap - A map containing anchors and their associated pages.
 * @param {Object} file - The current file/page.
 * @param {String} style - The chosen xref style. Valid values: "full", "short", and "basic".
 * @param {String} appendixCaption - The set value of the appendix caption attribute.
 * @param {Object} inheritedAttributes - Optional: An object containing all aggregated page attributes.
 */
function applyXrefStyle(mapInput, catalog, componentAttributes, anchorPageMap, file, style, appendixCaption, inheritedAttributes = {}) {
    if (file.src.stem === "_config") {return}
    let relevantAnchorPageMap = anchorPageMap
    let relevantMapInput = mapInput

    // [1]: link to file; [2]: anchor (if set), [4]: xrefstyle with settings (if set), [5]: xrefstyle settings only (if set), [6]: Replacement text (if set)
    const re = /xref:([^\[]*\.adoc)(#[^\[]*)?(\[)(xrefstyle\s*=\s*([^,\]]*))?,?([^\]]*)\]/gm
    const reIncorrectXref = /xref:([^\[\.]*)(#[^\[]*)?(\[)(xrefstyle\s*=\s*([^,\]]*))?,?(.*)\]/gm
    const reExceptions = /(^-{4}) *|(^={4}) *$|(^\/{4}) *|(^\+{4}) *$|(^\.{4}) *$|(^_{4}) */gm
    // const reIgnoreLine = /^.*\/{2}.*(xref:[^#\[]+)#.*|^.*`[^`\n]*(xref:[^#\[]+)#[^`\n]*`/gm
    const validStyles = ["full", "short", "basic"]
    const debugName = "qweuipoqwueiprüü"
    let skip = Array(6).fill(false)
    let debug = false
    // debug = file.contents.toString().includes("= Crossings and cross path")
    if (debug) { console.log("####\n####\nSTART TEST\n####\n####") }
    if (!file.contents) {
        return
    }
    let reftext
    // console.log("Check c-1", file.src.stem)
    switch (style) {
        case 'full':
            reftext = ContentAnalyzer.getAttributeFromFile(file, "reftext_full", 15);
            break;
        case 'short':
            reftext = ContentAnalyzer.getAttributeFromFile(file, "reftext_short", 15);
            break;
        case 'basic':
            reftext = ContentAnalyzer.getAttributeFromFile(file, "reftext_basic", 15);
            break;
    }
    // if (debug) {console.log("reftext:",reftext);console.log(inheritedAttributes.reftext);console.log("style:",style)}
    if (reftext) { ContentManipulator.updateAttributeWithValueOnPage(file, "reftext", reftext) }
    const content = file.contents.toString().split("\n")
    let contentUpdated = content
    for (const [index, line] of content.entries()) {
        // console.log("Check d", line)
        const wasTrue = skip.includes(true)
        const exceptionFound = line.match(reExceptions)
        if (exceptionFound) {
            if (exceptionFound[0] === "----") { skip[0] = !skip[0] }
            else if (exceptionFound[0] === "====") { skip[1] = !skip[1] }
            else if (exceptionFound[0] === "////") { skip[2] = !skip[2] }
            else if (exceptionFound[0] === "++++") { skip[3] = !skip[3] }
            else if (exceptionFound[0] === "....") { skip[4] = !skip[4] }
            else if (exceptionFound[0] === "____") { skip[5] = !skip[5] }
        }
        if (skip.includes(true)) { continue }
        if (line.trim().startsWith("//")) { continue }
        ContentAnalyzer.updatePageAttributes(inheritedAttributes, line)
        let newLine = ContentAnalyzer.replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
        re.lastIndex = 0
        let match
        if (!newLine.match(re) && newLine.match(reIncorrectXref)) { console.warn("incomplete xref link found:", newLine.match(reIncorrectXref)[0]) }
        while ((match = re.exec(newLine)) !== null) {
            if (debug) {console.log("match", match)}
            let anchorSource
            let xrefLabel
            if (match.index === re.lastIndex) {
                re.lastIndex++;
            }
            const tempStyle = (match[5] && validStyles.includes(match[5])) ? match[5] : style
            if (debug) {console.log("tempStyle", tempStyle)}
            const targetPath = ContentAnalyzer.getSrcPathFromFileId(match[1])
            if (!targetPath.module) { targetPath.module = file.src.module }            
            if (!targetPath.version) { targetPath.version = file.src.version }
            let xrefTarget = targetPath.component ? mapInput.contentCatalog.find(x => x.src.module === targetPath.module && x.src.relative === targetPath.relative && x.src.component === targetPath.component && x.src.version === targetPath.version) : catalog.find(x => x.src.module === targetPath.module && x.src.relative === targetPath.relative)
            // if (debug) {console.log("targetPath", targetPath)}
            // if (debug) {console.log("xrefTarget", xrefTarget)}
            // if (debug) {console.log("src", file.src)}
            if (!xrefTarget) {
                if (!ContentAnalyzer.getTargetFileOverAllContent(match[1], file, mapInput)) {
                    const p = file.src.abspath ? file.src.abspath : file.src.path
                    console.warn("could not determine target of xref...", match[0], "in", p);
                }
                xrefTarget = targetPath.component && !xrefTarget ? mapInput.contentCatalog.find(x => x.src.module === targetPath.module && x.src.relative === targetPath.relative && x.src.component === targetPath.component && x.src.version === targetPath.version) : xrefTarget
                if (!xrefTarget) {
                    continue
                }
                else {
                    console.warn(`found alternative match in different version ${xrefTarget.src.version} instead of ${targetPath.version}`)
                    console.warn("consider improving this xref")
                }
            }
            if (xrefTarget.src.stem === "_config.adoc") { continue }
            if (match[2]) {
                if (file.src.component !== xrefTarget.src.component && !relevantAnchorPageMap.get(match[2].slice(1))) {
                    const newMapInput = JSON.parse(JSON.stringify(mapInput))
                    const component = xrefTarget.src.component
                    const version = xrefTarget.src.version
                    newMapInput['pages'] = mapInput.fullContentCatalog.findBy({ component, version, family: 'page' })
                    newMapInput['navFiles'] = mapInput.fullContentCatalog.findBy({ component, version, family: 'nav' }).sort((a, b) => {
                        return a.nav.index - b.nav.index
                    })
                    newMapInput['component'] = component
                    newMapInput['version'] = version
                    newMapInput['componentAttributes'] = mapInput.fullContentCatalog.getComponents().filter(x => x.name === component)[0].versions.filter(x => x.version === version)[0].asciidoc.attributes
                    newMapInput['catalog'] = mapInput.fullContentCatalog.findBy({ component, version })

                    relevantAnchorPageMap = ContentAnalyzer.getAnchorsFromPageOrPartial(newMapInput, newMapInput.catalog, xrefTarget, newMapInput.componentAttributes, newMapInput.navFiles)
                    relevantAnchorPageMap = ContentAnalyzer.indexifyAnchorMap(relevantAnchorPageMap, ContentAnalyzer.createdSortedNavFileContent(newMapInput))
                    relevantMapInput = newMapInput
                } else if (file.src.component === xrefTarget.src.component && !relevantAnchorPageMap.get(match[2].slice(1))) {
                    relevantAnchorPageMap = anchorPageMap
                    relevantMapInput = mapInput
                }
                anchorSource = relevantAnchorPageMap.get(match[2].slice(1)) ? relevantAnchorPageMap.get(match[2].slice(1)).source : xrefTarget
                if (!relevantAnchorPageMap.get(match[2].slice(1)) && targetPath.component === file.src.component) {
                    if (!anchorErrors.find(x => (x.file === file && x.anchors.includes(match[2].slice(1))))) {
                        console.warn("ERROR IN FILE", file.src.abspath ? file.src.abspath : file.src.path)
                        console.warn("anchor", match[2].slice(1), "not found in anchor map!")
                        const altMatch = relevantAnchorPageMap.get(match[2].slice(1).replace("top-", "sec-"))
                        if (altMatch) {
                            console.warn("found alternate match", match[2].slice(1).replace("top-", "sec-"), "instead...")
                        }
                        if (anchorErrors[file]) {
                            anchorErrors[file].anchors.push(match[2].slice(1))
                        }
                        else {
                            const newError = { file: file, anchors: [match[2].slice(1)] }
                            anchorErrors.push(newError)
                        }
                    }
                    continue
                }
                if (anchorSource !== xrefTarget && (!relevantAnchorPageMap.get(match[2].slice(1)).usedIn || !relevantAnchorPageMap.get(match[2].slice(1)).usedIn.find(x => x === xrefTarget))) {
                    console.warn("ERROR IN FILE", file.src.abspath ? file.src.abspath : file.src.path)
                    const usedIn = relevantAnchorPageMap.get(match[2].slice(1)).usedIn ? relevantAnchorPageMap.get(match[2].slice(1)).usedIn : relevantAnchorPageMap.get(match[2].slice(1)).source
                    console.warn("anchor", match[2].slice(1), "has no occurrence in file", xrefTarget.src ? xrefTarget.src.path : xrefTarget, ".\nAnchor is actually found in", usedIn.src ? usedIn.src.path : usedIn)
                    continue
                }
                const parentPage = xrefTarget === anchorSource ? {} : xrefTarget
                // if (debug) {console.log("parentPage",parentPage); console.log("anchorSource",anchorSource)}
                // if (debug) { console.log(JSON.stringify({ anchor: match[2].slice(1), relevantMap: Array.from(relevantAnchorPageMap.keys()), anchorSource: anchorSource.src.abspath, file: file.src.abspath })) }
                xrefLabel = ContentAnalyzer.getReferenceNameFromSource(relevantMapInput.componentAttributes, relevantAnchorPageMap, relevantMapInput.catalog, anchorSource, match[2].slice(1), tempStyle, parentPage)
                if (debug) { console.log("xrefLabel", xrefLabel) }
            } else if (match[1]) {
                const appendixRefsig = componentAttributes['appendix-caption'] ? componentAttributes['appendix-caption'] : "Appendix"
                const sectionRefsig = componentAttributes['section-refsig'] ? componentAttributes['section-refsig'] : "Section"
                let { returnValue, title, reftext, prefix } = ContentAnalyzer.getTopAnchorValues(xrefTarget, xrefTarget.contents.toString(), tempStyle)
                if(debug) {console.log(JSON.stringify({appendixRefsig, sectionRefsig, returnValue, title, reftext, prefix}))}
                xrefLabel = ContentAnalyzer.applyStyleForXrefLabel(tempStyle, returnValue, reftext, prefix, "top", appendixRefsig, title, sectionRefsig)
                if (debug) { console.log("xrefLabel", xrefLabel) }
            }

            if (match[6] || (match[2] && (match[2].startsWith("#fig-") || match[2].startsWith("#tab-")))) { }
            // if (match[6] || (match[2] && (match[2].startsWith("#fig-")||match[2].startsWith("#tab-")))) {if (debug){throw "MISTAKES WERE MADE"}}
            else if (xrefLabel) {
                const start = newLine.indexOf("[", match.index) + 1
                if ((xrefTarget === file && match[5]) || (["", null].includes(xrefLabel) && match[5])) { }
                else if (xrefTarget === file || ["", null].includes(xrefLabel)) {
                    newLine = newLine.slice(0, start) + `xrefstyle=${style}` + newLine.slice(start)
                }
                else {
                    xrefLabel = match[5] ? xrefLabel + ", " : xrefLabel
                    newLine = newLine.slice(0, start) + `${xrefLabel}` + newLine.slice(start)
                }
                contentUpdated[index] = newLine
            }
            // else if (match[5]) { }
            else {
                const start = newLine.indexOf("[", match.index) + 1
                newLine = newLine.slice(0, start) + `xrefstyle=${style}` + newLine.slice(start)
                contentUpdated[index] = newLine
            }
        }
        // if (debug && newLine.includes("adoc#sec-modal-verbs")) {console.log(newLine); throw "CHECKIN"}
        let targetFile = ContentAnalyzer.checkForIncludedFileFromLine(catalog, file, newLine)
        if (targetFile) {
            applyXrefStyle(mapInput, catalog, componentAttributes, relevantAnchorPageMap, targetFile, style, appendixCaption, inheritedAttributes)
        }
    }
    if (debug) { throw "STOP" }
    file.contents = Buffer.from(contentUpdated.join("\n"))
}

module.exports = {
    addXrefStyleToSectionAndPageXrefs
}