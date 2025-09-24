'use strict'
//-------------
//-------------
// Core module for analyzing adoc content.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

var nonStandardAnchors = []
var anchorWarnings = []
var count = 0

/**
 * Analyze a path of an include macro and identifies the linked file, if it exists.
 * @param {Array <Object>} pages - An array of all pages.
 * @param {Object} thisPage - The page where the include macro was found.
 * @param {*} includePath - The path extracted from the page. Either a split path (Array) or a single String.
 * @param {Boolean} published - Optional: If false, also considers content that is not published. Useful for partials.
 * @returns {Object} The identified page.
 */
function determineTargetPageFromIncludeMacro(pages, thisPage, includePath, published = true) {
    if (!Array.isArray(includePath)) {
        includePath = includePath.split("/")
    }
    let currentPath = thisPage.src.path.split("/")
    currentPath.pop()
    if (published && thisPage.out) { currentPath = thisPage.out.dirname.split("/") }
    includePath.forEach(part => {
        if (part === "..") { currentPath = currentPath.slice(0, -1) }
        else if (part === ".") { }
        else { currentPath.push(part) }
    })
    const targetPath = currentPath.join("/")
    let includedPage = published ? pages.filter(page => page.out && page.out.dirname + "/" + page.src.basename === targetPath)[0] : pages.filter(page => page.src.path === targetPath)[0]
    return includedPage
}

/**
 * Updates a page's list of attributes based on the provided line from the content.
 * @param {Object} pageAttributes - The currently valid attributes.
 * @param {String} line - The line to be analyzed.
 */
function updatePageAttributes(pageAttributes, line) {
    const reAttribute = /^\s*:(!)?([^:!]+)(!)?:(.*)$/m
    const resAttribute = line.match(reAttribute)
    if (resAttribute) {
        if (resAttribute[1] || resAttribute[3]) {
            delete pageAttributes[resAttribute[2]]
        }
        else { pageAttributes[resAttribute[2]] = resAttribute[4] ? resAttribute[4] : "" }
    }
}

/**
 * Replace all attributes in a line with their value, if possible.
 * @param {Object} componentAttributes - All attributes set in the component or the site.
 * @param {Object} pageAttributes - All attributes set up to the provided line.
 * @param {String} line - The line where any attributes should be replaced.
 * @returns {String} The updated line, if possible.
 */
function replaceAllAttributesInLine(componentAttributes, pageAttributes, line) {
    const reAttributeApplied = /(\/\/.*)?{([^}]+)}/gm;
    reAttributeApplied.lastIndex = 0;
    let newLine = line
    let m;
    let i = 0
    let debug = false
    // if (debug) {console.log(line)}
    while ((m = reAttributeApplied.exec(newLine)) !== null) {
        // if (debug) {console.log(m)}
        if (m[1]) { break; }
        if (m.index === reAttributeApplied.lastIndex && i >= 20) {
            reAttributeApplied.lastIndex++;
            i = 0;
        }
        else if (m.index === reAttributeApplied.lastIndex) { i++; }
        const replacement = componentAttributes[`'${m[2]}'`] ? componentAttributes[`'${m[2]}'`].trim() : componentAttributes[m[2]] ? componentAttributes[m[2]].trim() : (pageAttributes[m[2]] ? pageAttributes[m[2]].trim() : undefined)
        if (replacement) {
            newLine = newLine.replace(m[0], replacement)
            reAttributeApplied.lastIndex = 0
        }
        else if (m[2] === "nbsp") {
        }

    }
    return newLine
}

/**
 *
 * Extracts all manually defined anchors from an AsciiDoc file. Also traverses through included files.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'fullContentCatalog'.
 * @param {Array <Object>} catalog - An array of all pages and partials.
 * @param {Object} thisFile - The current page.
 * @param {Object} componentAttributes - An object containing all attributes of the component.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {Object} inheritedAttributes - Optional: An object with the previously determined attributes for this file.
 * @param {Array <String>} tags - Optional: An array of tags to filter for.
 * @param {Object} lineOffset - Optional: An object containing a key "line" with Integer values denoting the line number offset accumulated from included files.
 * @returns {Map <String,Object>} A map of anchors and the page(s) where they were found (source: the original source; usedIn: the page(s) where it is used in).
 */
function getAnchorsFromPageOrPartial(mapInput, catalog, thisFile, componentAttributes, navFiles, inheritedAttributes = {}, tags = [], lineOffset = { line: 0 }) {
    const re = /(?<!(`|\/\/.*))\[\[{1,2}([^\],]+)(,([^\]]*))?\]\]|(?<!(`|\/\/.*))\[#([^\]]*)(,([^\]]*))?\]|(?<!(`|\/\/.*))anchor:([^\[]+)(,([^\]]*))?\[/
    const reInclude = /^\s*include::(\S*partial\$|\S*page\$)?([^\[]+\.adoc)\[(.+)?\]/m;
    const reTags = /.*,?tags?=([^,]+)/m;
    const reTaggedStart = /\/\/\s*tag::(.+)\[\]/m
    const reTaggedEnd = /\/\/\s*end::(.+)\[\]/m
    const reIgnoreToggle = /-{4}|^`{3}\s*$|\/{4}|^={4}\s*$/m    // verbose = verbose ? verbose : thisFile.src.stem === "entity"
    let resultMap = new Map
    let results = []
    let ignoreLine = false,
        ignoreBlock = { sourceBlock: false, exampleBlock: false, inlineSource: false, commentBlock: false };
    const splitContent = thisFile.contents.toString().split("\n")
    // let lineOffset = 0
    let allowInclude = (tags.length > 0) ? false : true
    let taggedRegions = {}
    //-------------
    // Check all tags and set search behavior depending on
    // a) any tag is set?
    // b) at least one negated tag is set?
    //-------------
    for (let t of tags) {
        let v = t.startsWith("!") ? false : true;
        if (!v) { allowInclude = true }
        t = t.startsWith("!") ? t.slice(1) : t
        taggedRegions[t] = { include: v, active: false }
    }
    let currentLineIndex = -1
    for (let line of splitContent) {
        //-------------
        // Set search behavior depending on active tags and skip lines explicitly excluded through tagged regions.
        // TODO: Handle wildcard tags!
        //-------------
        if (tags.length > 0) {
            const tagStartMatch = line.match(reTaggedStart)
            const tagEndMatch = line.match(reTaggedEnd)
            if (tagStartMatch && taggedRegions[tagStartMatch[1]]) {
                taggedRegions[tagStartMatch[1]].active = true
            }
            else if (tagEndMatch && taggedRegions[tagEndMatch[1]]) {
                taggedRegions[tagEndMatch[1]].active = false
            }
            allowInclude = Object.entries(taggedRegions).filter(([k, v]) => !v.include).length > 0 ? Object.entries(taggedRegions).filter(([k, v]) => (!v.include && v.active)).length === 0 : Object.entries(taggedRegions).filter(([k, v]) => v.active).length > 0
        }
        if (!allowInclude) { continue; }
        currentLineIndex = splitContent.indexOf(line, currentLineIndex + 1)

        //-------------
        // Add special behavior for custom "use-antora-rules" attribute
        //-------------
        if (line.indexOf("ifndef::") > -1 && line.indexOf("use-antora-rules") > -1) {
            ignoreLine = true
        }
        else if (ignoreLine && line.indexOf("endif::") > -1) {
            ignoreLine = false
        }

        const matchIgnoreToggle = line.match(reIgnoreToggle)
        if (matchIgnoreToggle) {
            switch (matchIgnoreToggle[0]) {
                // /-{4}|^`{3}\s*$|\/{4}|^={4}\s*$/
                case String(matchIgnoreToggle[0].match(/-{4}/)):
                    ignoreBlock.sourceBlock = !ignoreBlock.sourceBlock;
                    break;
                case String(matchIgnoreToggle[0].match(/^={4}\s*/)):
                    ignoreBlock.exampleBlock = !ignoreBlock.exampleBlock;
                    break;
                case String(matchIgnoreToggle[0].match(/^`{3}\s*$/)):
                    ignoreBlock.inlineSource = !ignoreBlock.inlineSource;
                    break;
                case String(matchIgnoreToggle[0].match(/\/{4}/)):
                    ignoreBlock.commentBlock = !ignoreBlock.commentBlock;
                    break;
            }
        }
        if (ignoreLine || Object.values(ignoreBlock).some(e => e)) { continue; }
        //-------------
        // Get all attributes from this line and parse its content. If a file is included, check it. Otherwise, check if any anchor is found and, if so, add it to the list.
        //-------------
        updatePageAttributes(inheritedAttributes, line)
        line = replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
        let includeSearchResult = line.match(reInclude)
        // if (includeSearchResult && includeSearchResult.length > 0) {
        //     line = replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
        //     includeSearchResult = line.match(reInclude)
        // }
        // line = replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
        if (includeSearchResult && includeSearchResult.length > 0) {
            let targetFile
            if (includeSearchResult[1]) {
                targetFile = determineTargetPartialFromIncludeMacro(catalog, thisFile, includeSearchResult[1], includeSearchResult[2])
                if (!targetFile) {
                    targetFile = getTargetFileOverAllContent(includeSearchResult[1] + includeSearchResult[2], thisFile, mapInput)
                }
            }
            else {
                targetFile = determineTargetPageFromIncludeMacro(catalog, thisFile, includeSearchResult[2], false)
                if (!targetFile) {
                    targetFile = getTargetFileOverAllContent(includeSearchResult[1] + includeSearchResult[2], thisFile, mapInput)
                }
            }
            if (targetFile && targetFile === thisFile) {console.log("Found an include for",targetFile.src.path,"in",thisFile.src.path)}
            else if (targetFile) {
                let tags = includeSearchResult[3] ? includeSearchResult[3].match(reTags) : []
                if (!tags) { tags = [] }
                if (tags.length > 0) {
                    tags = tags[1].split(";")
                }
                lineOffset.line += currentLineIndex
                const partialAnchorMap = getAnchorsFromPageOrPartial(mapInput, catalog, targetFile, componentAttributes, navFiles, inheritedAttributes, tags, lineOffset)
                lineOffset.line -= currentLineIndex
                resultMap = mergeAnchorMapEntries(resultMap, partialAnchorMap, navFiles, thisFile)
            }
            else {
                console.warn("could not find", includeSearchResult[0])
                if (includeSearchResult[0].includes("terms_and_definitions")) {console.log(mapInput.contentCatalog.find(x => x.src.stem.includes("terms_and_definitions_opendrive"))); throw "STOPO "}
            }
        }
        else {
            const result = re.exec(line);
            if (result) {
                result.line = currentLineIndex + lineOffset.line
                results.push(result)
            }
        }
    }
    //-------------
    // If at least one anchor was found, parse each match and update the corresponding anchor map.
    //-------------
    if (results) {
        for (let entry of results) {
            const e1 = entry[2]
            const e2 = entry[6]
            const e3 = entry[8]
            const line = entry.line

            const resultValue = e1 ? e1 : e2 ? e2 : e3
            if (resultMap.has(resultValue)) {
                updateAnchorMapEntry(resultMap, resultValue, thisFile, line, navFiles)
            }
            else {
                resultMap.set(resultValue, { source: thisFile, line: line })
            }
        }
    }
    lineOffset.line += currentLineIndex
    return resultMap
}

/**
 * Determine target of include from complete collection.
 * @param {*} includeSearchResult - 
 * @param {Object} thisFile - 
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'contentCatalog'.
 * @returns {Object} The found file
 */
function getTargetFileOverAllContent(includeAddress, thisFile, mapInput) {
    const targetPath = getSrcPathFromFileId(includeAddress)
    const version = targetPath.version ? targetPath.version : thisFile.src.version
    const module = targetPath.module ? targetPath.module : thisFile.src.module
    const component = targetPath.component ? targetPath.component : thisFile.src.component
    const family = targetPath.type ? targetPath.type : thisFile.src.family
    return mapInput.contentCatalog.find(x => x.src.version === version && x.src.module === module && x.src.component === component && x.src.family === family)
}

/**
 * Update function specifically designed for anchor maps.
 * @param {Map <String, Object>} inputMap - The in put map whose entry needs to be updated.
 * @param {String} key - The key which needs to be updated.
 * @param {*} addedValue - The new value.
 * @param {Integer} line - The line index at which the entry was found.
 * @param {Object} navFiles - An object containing all navigation files.
 */
function updateAnchorMapEntry(inputMap, key, addedValue, line, navFiles) {
    let entry = inputMap.get(key)
    if (entry.usedIn) {
        entry.usedIn.push(addedValue)
        entry.usedInLine.push(line)
    }
    else {
        entry.usedIn = [addedValue]
        entry.usedInLine = [line]
    }
    // entry.line = line
}

/**
 * Returns the values of the keywords attribute of a file.
 * @param {Object} page - The page that is analyzed.
 * @returns {*} The match of the regular expression, where the first group contains the list of keywords and res.line is the line the attribute was found in.
 */
function getAllKeywordsAsArray(page) {
    var re = /^\s*:keywords:(.*)/
    var content = page.contents.toString().split("\n")
    var i = 0
    var res;
    for (let line of content) {
        res = re.exec(line)
        if (res) {
            break;
        }
        i++;
    }
    res.line = i
    return (res)
}

/**
 * Returns the content of a file after merging all includes into it.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} page - The current page.
 * @param {String} targetStop - Optional: If set, finds a specific anchor of type [#anchor].
 * @param {Integer} addOffsetToSection - Optional: Adds an offset to all sections. Used for included file content.
 * @returns {Array <String,Integer>} The merged content and the offset for the provided targetStop, if any.
 */
function getMergedFileContent(pages, page, targetStop = undefined, addOffsetToSection = 0) {
    const reSectionStart = /^(=+)\s[^\n]+/
    const reIncludeStart = /^\s*include::([^\[]+)\[(leveloffset=\+(\d+))?\]/
    let targetLevelOffset = 0
    const content = page.contents.toString()
    let newContent = []
    for (let line of content.split("\n")) {
        const sectionSearchResult = line.match(reSectionStart)
        const includeSearchResult = line.match(reIncludeStart)
        if (targetStop && line.includes(targetStop)) {
            newContent.push(line)
            break;
        }
        if (sectionSearchResult && sectionSearchResult.length > 0 && addOffsetToSection > 0) {
            line = "=".repeat(parseInt(addOffsetToSection)) + line
        }
        if (includeSearchResult && includeSearchResult.length > 0) {
            const leveloffset = includeSearchResult[3] ? parseInt(includeSearchResult[3]) : 0
            const targetPage = determineTargetPageFromIncludeMacro(pages, page, includeSearchResult[1])
            if (targetPage) {
                let includedContent, includedOffset
                [includedContent, includedOffset] = getMergedFileContent(pages, targetPage, targetStop, addOffsetToSection + leveloffset)
                newContent = newContent.concat(includedContent)
                if (targetStop && includedContent.includes(targetStop)) {
                    targetLevelOffset += leveloffset + includedOffset
                    break;
                }
            }
        }
        else {
            newContent.push(line)
        }
    }
    return [newContent.join("\n"), targetLevelOffset]
}

/**
 * Determines the number of relevant sections up to a maximum section value.
 * This function also parses all included files that may be relevant depending on their accumulated leveloffset value.
 * @param {Array <Object>} pages - An array of pages.
 * @param {Object} page - The current page.
 * @param {Integer} targetSectionLevel - The sectionlevel that is currently relevant.
 * @param {String} startText - Optional: If set, finds a specific anchor of type [#anchor] or [[anchor]].
 * @returns {Array <Integer>} The determined number of sections for the targetSectionLevel and below.
 */
function getRelativeSectionNumberWithIncludes(pages, page, targetSectionLevel, startText = "", isFromInclude = false) {
    const reSectionStart = /^(=+)\s[^\n]+/
    const reIncludeStart = /^\s*include::([^\[]+)\[(leveloffset=\+(\d+))?\]/

    let currentTargetSectionLevel = targetSectionLevel
    let relativeIndex = startText ? [1] : [0]
    let content = page.contents.toString()
    if (isFromInclude) {
        // include all content from start until startText is found
        // update currentTargetSectionLevel according to accumulated leveloffset
        // TBD: Update relativeIndex?
        let targetLevelOffset
        [content, targetLevelOffset] = getMergedFileContent(pages, page, `[#${startText}]`)
        currentTargetSectionLevel += targetLevelOffset
    }
    //-------------
    // If the parameter startText is defined, limit the content to everything above that anchor.
    //-------------
    if (startText) {
        const indexType1 = content.indexOf("[#" + startText + "]")
        const indexType2 = content.indexOf("[[" + startText + "]]")
        if (indexType1 > -1) {
            content = content.slice(0, indexType1);
        }
        else if (indexType2 > -1) {
            content = content.slice(0, indexType2)
        }
    }
    //-------------
    // Reverse through the remaining content line by line and get all relevant sections.
    // If any files are included and they are adoc files, also traverse through them to determine the complete number of sections the page will have after Asciidoctor has compiled the final content.
    //-------------
    content.split("\n").reverse().forEach(line => {
        const sectionSearchResult = line.match(reSectionStart)
        const includeSearchResult = line.match(reIncludeStart)
        //-------------
        // Handle an included file in case the included sections could be of relevance (i.e. they are level 2 after inclusion).
        // This takes the leveloffset attribute into account.
        // NOTE: This does NOT handle included files with tags correctly!
        //-------------
        if (includeSearchResult && includeSearchResult.length > 0) {
            const leveloffset = includeSearchResult[3] ? targetSectionLevel - includeSearchResult[3] : targetSectionLevel
            if (leveloffset > 0) {
                const targetPage = determineTargetPageFromIncludeMacro(pages, page, includeSearchResult[1])
                if (targetPage) {
                    let includedSectionNumbers = getRelativeSectionNumberWithIncludes(pages, targetPage, leveloffset)
                    for (let i in includedSectionNumbers) {
                        relativeIndex[i] += includedSectionNumbers[i]
                    }
                }
            }
        }
        //-------------
        // Handle a found section depending on its level vs. the target level.
        //-------------
        if (sectionSearchResult && sectionSearchResult.length > 0) {
            const foundSectionLevel = sectionSearchResult[1].split("=").length - 1
            if (foundSectionLevel === currentTargetSectionLevel) {
                relativeIndex[0] = relativeIndex[0] + 1
            }
            else if (foundSectionLevel === currentTargetSectionLevel - 1) {
                relativeIndex.reverse()
                relativeIndex.push(1)
                relativeIndex.reverse()
                currentTargetSectionLevel = foundSectionLevel
            }
            // else {console.log("irrelevant section")}
        }
    })
    return relativeIndex
}

/**
 * Updates a provided inheritedAttributes object with all attributes found within a file and included partials up to a specific line.
 * @param {Object} catalog - The filtered content catalog (pages and partials)
 * @param {Object} componentAttributes - An object containing all attributes of the component.
 * @param {Object} inheritedAttributes -An object containing all attributes from this page and included partials.
 * @param {Integer} index - The index of the line up to which the file is to be analyzed.
 * @param {Object} file  - The file that is to be analyzed.
 */
function getActivePageAttributesAtLine(catalog, componentAttributes, inheritedAttributes, index, file) {
    const content = index ? file.contents.toString().split("\n").slice(0, index + 1) : file.contents.toString().split("\n")
    for (let line of content) {
        let newLine = replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
        let includeTarget = checkForIncludedFileFromLine(catalog, file, newLine)
        if (includeTarget) {
            getActivePageAttributesAtLine(catalog, componentAttributes, inheritedAttributes, null, includeTarget)
        }
        else { updatePageAttributes(inheritedAttributes, newLine) }
    }
}

/**
 * Retrieves the name associated with an anchor so it can be used as label when linking to other pages.
 * @param {Object} componentAttributes - An object containing all attributes of the component.
 * @param {Map <String, Object>} anchorPageMap - A map containing all found anchors and their pages.
 * @param {Array <Object>} pages - An array of all pages.
 * @param {Object} page - The current page where the xref points to.
 * @param {String} anchor - The anchor in question.
 * @param {String} style - Optional: A specific reference style to be returned. Options: "full", "short", or "basic".
 * @param {Object} parentPage - Optional: The page the xref points to if it is not the source of the anchor.

 * @returns {String} The extracted alt text.
 */
function getReferenceNameFromSource(componentAttributes, anchorPageMap, pages, page, anchor, style = "", parentPage = {}) {
    // console.log("Start func")
    const reSectionEqualSigns = /^\s*(=+)\s+(.*)$/m
    const reCaptionLabel = /^\.(\S.+)$/m
    const reAnchorType = /#?([^-\]]+)-?[^\]]*/m
    const regexAnchor = anchor.replaceAll("-", "\\-").replaceAll(".", "\\.").replaceAll("(", "\\(").replaceAll(")", "\\)")
    const regexAltAnchor = regexAnchor.slice(4)
    const reAnchor = new RegExp(`\\[\\[{1,2}${regexAnchor}(,([^\\]]*))?\\]\\]|\\[\#${regexAnchor}(,([^\\]]*))?\\]|anchor:${regexAnchor}(,([^\\]]*))?`, 'm')
    const reAltAnchor = new RegExp(`\\[\\[${regexAltAnchor}(,([^\\]]*))?\\]\\]|\\[\#${regexAltAnchor}(,([^\\]]*))?\\]|anchor:${regexAltAnchor}(,([^\\]]*))?`, 'm')
    let inheritedAttributes = {}
    let content = page.contents.toString()
    const contentSplit = content.split("\n")
    getActivePageAttributesAtLine(pages, componentAttributes, inheritedAttributes, contentSplit.length, page)
    for (let line of contentSplit) {
        updatePageAttributes(inheritedAttributes, line)
        const index = contentSplit.indexOf(line)
        contentSplit[index] = replaceAllAttributesInLine(componentAttributes, inheritedAttributes, line)
    }
    content = contentSplit.join("\n")

    let resultAnchorType = anchor.match(reAnchorType)
    if (!content.match(reAnchor) && content.match(reAltAnchor)) { console.warn(`${anchor} could not be found in file ${page.src.abspath}, but found similar match instead! Please check file`); return null }
    else if (!content.match(reAnchor)) { console.warn(`${anchor} could not be found in file ${page.src.abspath}`); return null }
    const indexOfAnchor = content.match(reAnchor).index | null
    if (indexOfAnchor !== null && indexOfAnchor > -1) {
        getActivePageAttributesAtLine(pages, componentAttributes, inheritedAttributes, indexOfAnchor, page)
    }
    else {
        console.warn(`cannot operate on ${anchor} in file ${page.src.abspath}`)
        console.warn(indexOfAnchor)
        return null
    }
    const resultForNextHeading = content.slice(indexOfAnchor).match(reSectionEqualSigns)
    // const resultForPreviousHeading = content.slice(0,indexOfAnchor).match(reSectionEqualSigns)
    const resultNextCaption = content.slice(indexOfAnchor).match(reCaptionLabel)
    const countLineBreaksHeading = resultForNextHeading ? content.slice(indexOfAnchor, indexOfAnchor + resultForNextHeading.index).split("\n").length : 0
    const countLineBreaks = resultNextCaption ? content.slice(indexOfAnchor, indexOfAnchor + resultNextCaption.index).split("\n").length : 0
    const lineBreakLimitBreached = countLineBreaks > 4 ? true : false
    // Use special anchor formats: sec, top, fig, tab, ...
    let result
    let returnValue = ""
    let prefix = ""
    let title = ""
    let reftext
    const sectionRefsig = componentAttributes['section-refsig'] ? componentAttributes['section-refsig'] : "Section"
    const appendixRefsig = componentAttributes['appendix-caption'] ? componentAttributes['appendix-caption'] : "Appendix"
    const figureCaption = inheritedAttributes['figure-caption'] ? inheritedAttributes['figure-caption'] : componentAttributes['figure-caption'] ? componentAttributes['figure-caption'] : "Figure"
    const tableCaption = inheritedAttributes['table-caption'] ? inheritedAttributes['table-caption'] : componentAttributes['table-caption'] ? componentAttributes['table-caption'] : "Table"
    // const exampleCaption = inheritedAttributes['example-caption'] ? inheritedAttributes['example-caption'] : componentAttributes['example-caption'] ? componentAttributes['example-caption'] : "Example"
    const codeCaption = inheritedAttributes['listing-caption'] ? inheritedAttributes['listing-caption'] : componentAttributes['listing-caption'] ? componentAttributes['listing-caption'] : ""
    // let verbose = (anchor==="sec-lc-aggregate-types" && style === "full")
    //-------------
    // Only act on anchors that match one of the ASAM anchor types (matching reAnchorType).
    //-------------
    if (resultAnchorType) {
        lintAnchors(anchor, page, resultAnchorType, countLineBreaks, content, indexOfAnchor, countLineBreaksHeading, resultForNextHeading)
        const entryIndex = anchorPageMap.get(anchor) ? anchorPageMap.get(anchor).index : null
        if (!entryIndex) return "No Index"
        if (Object.entries(parentPage).length > 0 && resultAnchorType[1] === "top") { resultAnchorType[1] = "sec" }
        switch (resultAnchorType[1]) {
            case "fig":
                [result, title, prefix, returnValue] = useShortRefRule(entryIndex, figureCaption, "fig-")
                break;
            case "tab":
                [result, title, prefix, returnValue] = useShortRefRule(entryIndex, tableCaption, "tab-")
                break;
            case "code":
                [result, title, prefix, returnValue] = useShortRefRule(entryIndex, codeCaption, "code-")
                break;
            case "top":
                ({ title, reftext, prefix, returnValue } = getTopAnchorValues(page, content, style))
                break;
            case "sec":
                result = resultForNextHeading ? resultForNextHeading : content.match(/^(=) (.*)$/m);
                // if (verbose)  {console.log(result)}
                let pageNumber
                let relativeSectionNumber
                if (Object.entries(parentPage).length > 0) {
                    pageNumber = getAttributeFromFile(parentPage, "titleoffset")
                    relativeSectionNumber = getRelativeSectionNumberWithIncludes(pages, parentPage, result[1].split("=").length - 1, anchor, true);
                }
                else {
                    pageNumber = getAttributeFromFile(page, "titleoffset")
                    relativeSectionNumber = getRelativeSectionNumberWithIncludes(pages, page, result[1].split("=").length - 1, anchor);
                }
                // let pageNumber = getAttributeFromFile(page, "titleoffset");
                if (!pageNumber) { pageNumber = ""; }
                else { pageNumber = pageNumber.trim(); }
                // let relativeSectionNumber = getRelativeSectionNumberWithIncludes(pages, page, result[1].split("=").length - 1, anchor);
                relativeSectionNumber[0] = ""
                prefix = isNaN(pageNumber.charAt(0)) ? `${appendixRefsig} ${pageNumber}`.trim() : `${sectionRefsig} ${pageNumber}`.trim();
                prefix = relativeSectionNumber.length > 1 && pageNumber !== "" ? prefix + relativeSectionNumber.join(".") : prefix;
                title = result[2].trim();
                break;
            case "bib":
                break;
            default:
                if (!nonStandardAnchors.includes(anchor)) {
                    console.warn("non-standard anchor type detected: ", anchor);
                    nonStandardAnchors.push(anchor)
                }
                returnValue = getAltTextFromTitle(page, content);
                break;
        }
        //-------------
        // Update the return value based on the selected style (if any). Otherwise, leave as is.
        //-------------
        returnValue = applyStyleForXrefLabel(style, returnValue, reftext, prefix, resultAnchorType, appendixRefsig, title, sectionRefsig)
    }
    //-------------
    // Backup: If all else fails (i.e. an invalid anchor was found), get the alt text from the title.
    //-------------
    else {
        returnValue = getAltTextFromTitle(page, content);
    }
    returnValue = preventLatexMathConversion(replaceAllAttributesInLine(componentAttributes, inheritedAttributes, returnValue))    
    return (returnValue)

    function useShortRefRule(entryIndex, caption, type) {
        result = lineBreakLimitBreached ? null : resultNextCaption
        const typeIndex = getAnchorPageMapEntryValue(anchorPageMap, entryIndex, type)
        if (result) {
            title = result[1]
            prefix = caption.length > 0 ? caption + ' ' + typeIndex : null;
            returnValue = title
        }
        return [result, title, prefix, returnValue]
    }
}

function applyStyleForXrefLabel(style, returnValue, reftext, prefix, resultAnchorType, appendixRefsig, title, sectionRefsig) {
    switch (style) {
        case "full":
            returnValue = reftext ? reftext : prefix && resultAnchorType[1] === "top" && prefix.startsWith(appendixRefsig) ? `${prefix} __${title}__` : prefix && (prefix !== sectionRefsig && prefix !== appendixRefsig) ? `${prefix}, "${title}"` : prefix ? `${prefix} "${title}"` : `${title}`
            break
        case "short":
            returnValue = reftext ? reftext : prefix ? prefix : title
            break
        case "basic":
            returnValue = reftext ? reftext : `${title}`
            break
        default:
            break
    }
    return returnValue
}

function getTopAnchorValues(page, content, style) {
    let reftext
    const returnValue = getAltTextFromTitle(page, content)
    let title = content.match(/^= (.*)$/m) ? content.match(/^= (.*)$/m)[1] : null
    title = title ? title : returnValue
    switch (style) {
        case "full":
            reftext = getAttributeFromFile(page, "reftext_full")
            break
        case "short":
            reftext = getAttributeFromFile(page, "reftext_short")
            break
        case "basic":
            reftext = getAttributeFromFile(page, "reftext_basic")
            break
    }
    const titleoffset = getAttributeFromFile(page, "titleoffset")
    const titleprefix = getAttributeFromFile(page, "tileprefix")
    const prefix = titleprefix ? titleprefix : titleoffset ? titleoffset : ""
    return { returnValue, title, reftext, prefix }
}

function preventLatexMathConversion(unsafe) {
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    const valueHasSourceCodeAtStartOfTitle = unsafe.match(/"(`([^`]*)`)/)
    return valueHasSourceCodeAtStartOfTitle ? unsafe.replace(valueHasSourceCodeAtStartOfTitle[1], `pass:[<code>${escapeHtml(valueHasSourceCodeAtStartOfTitle[2])}</code>]`) : unsafe
}



/**
 * Applies ASAM linting rules for anchors
 * @param {String} anchor - The anchor in question.
 * @param {Object} page - The current page.
 * @param {Object} resultAnchorType - The RegExp result for the anchor type.
 * @param {Integer} countLineBreaks - The counted number of line breaks between the anchor and the next title.
 * @param {String} content - The content of the file being analyzed.
 * @param {Integer} indexOfAnchor - The index of the anchor in the content.
 * @param {Integer} countLineBreaksHeading - The number of line breaks for headings.
 * @param {Object} resultForNextHeading - The next found heading after the match based on a regex.
 */
function lintAnchors(anchor, page, resultAnchorType, countLineBreaks, content, indexOfAnchor, countLineBreaksHeading, resultForNextHeading) {
    const reExampleBlock = /^(\[source([^\]]+)?\]\s*\n)?={4}$/m
    const reSourceBlock = /^\[source([^\]]+)?\]\s*\n-{4}\s*$/m
    let anchorWarningEntry = { anchor: anchor, page: page, type: null }
    switch (resultAnchorType[1]) {
        case "fig":
            break
        case "tab":
            break
        case "code":
            if (countLineBreaks > 2) {
                anchorWarningEntry.type = "title"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: No title found in next line after ${anchor}!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
                break
            }
            else {
                let matchExample = content.slice(indexOfAnchor).match(reExampleBlock)
                let matchSource = content.slice(indexOfAnchor).match(reSourceBlock)
                if (!(matchExample && content.slice(indexOfAnchor, indexOfAnchor + matchExample.index).split("\n").length === 3) && !(matchSource && content.slice(indexOfAnchor, indexOfAnchor + matchSource.index).split("\n").length === 3)) {
                    anchorWarningEntry.type = "block"
                    if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Code anchor ${anchor} not immediately followed by block after title!\nFile: ${page.src.abspath ? page.src.abspath : page.src}`); anchorWarnings.push(anchorWarningEntry) }
                }
                if (matchExample && content.slice(indexOfAnchor, indexOfAnchor + matchExample.index).split("\n").length === 3) {
                    anchorWarningEntry.type = "exAsCode"
                    if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`INFO: Code anchor ${anchor} used with example block!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
                }
                break
            }
        case "top":
            if (countLineBreaksHeading > 2) {
                anchorWarningEntry.type = "title"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Anchor ${anchor} not immediately followed by title!\nFile: ${page.src.abspath}\nCountLineBreaksHeading: ${countLineBreaksHeading}\nResultNextHeading: ${resultForNextHeading}`); anchorWarnings.push(anchorWarningEntry) }
            }
            else if (page.src.family === "partial") {
                anchorWarningEntry.type = "partialTitle"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Top anchor ${anchor} used in partial!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
            }
            else if (!resultForNextHeading || resultForNextHeading[1].length !== 1) {
                anchorWarningEntry.type = "section"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Anchor ${anchor} used for section, not title!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
            }
            break
        case "sec":
            if (countLineBreaksHeading > 2) {
                anchorWarningEntry.type = "title"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Anchor ${anchor} not immediately followed by title!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
            }
            else if (page.src.family === "page" && (!resultForNextHeading || resultForNextHeading[1].length === 1)) {
                anchorWarningEntry.type = "section"
                if (!anchorWarnings.find(x => (x.anchor === anchorWarningEntry.anchor && x.page === anchorWarningEntry.page && x.type === anchorWarningEntry.type))) { console.warn(`ASAM rule violation: Anchor ${anchor} used for title, not section!\nFile: ${page.src.abspath}`); anchorWarnings.push(anchorWarningEntry) }
            }
            break
    }
}

/**
 * Helper function to determine the correct index from the anchorPageMap for an anchor
 * @param {*} anchorPageMap 
 * @param {*} entryIndex 
 * @param {*} filterType 
 * @returns {Integer} Determiend lenth.
 */
function getAnchorPageMapEntryValue(anchorPageMap, entryIndex, filterType) {
    let newFilteredArray = []
    const filteredArray = [...anchorPageMap].filter(([k, v]) => {
        if (!k.startsWith(filterType) || v.index[0] > entryIndex[0] || v.index[0] === entryIndex[0] && v.index[1] > entryIndex[1]) return false
        return true
    })
    filteredArray.forEach(entry => {
        for (const [i, e] of entry[1].usedIn.entries()) {
            newFilteredArray.push([entry[0], e, entry[1].allIndices[i]])
        }
    })
    newFilteredArray = newFilteredArray.filter(x => {
        if (x[2][0] === -1 || x[2][0] > entryIndex[0]) return false
        if (x[2][0] === entryIndex[0] && x[2][1] > entryIndex[1]) return false
        return true
    })

    return newFilteredArray.length
}

/**
 * Determines the alt text for a link from the tile of a page. This includes set titleprefix and titleoffset attributes.
 * Defaults to the filename if all else fails.
 * @param {Object} page - The page for which the title needs to be extracted.
 * @param {String} content - The contents of that page.
 * @returns {String} The extracted title.
 */
function getAltTextFromTitle(page, content) {
    const re1 = /:titleprefix:\s*([^\n]+)/m
    const re2 = /:titleoffset:\s*([^\n]+)/m
    const re3 = /^=\s+([^\n\r]+)/m

    let returnValue
    let result = content.match(re1)
    if (!result || result.length <= 1) {
        result = content.match(re2)
    }
    const resultAlt = content.match(re3)
    if (result && result.length > 1) {
        returnValue = "Section " + result[1]
    }
    else {
        returnValue = resultAlt && resultAlt.length > 1 ? resultAlt[1] : page.src.stem
    }
    return returnValue
}

/**
 * Extracts the line index of the title, the index of the navtitle attribute, and the index of the reftext attribute, if applicable.
 * It also returns the contents of that page as an array.
 * @param {Object} page - The page that is analyzed.
 * @returns {Array <any>} [Content as array, indexOfTitle, indexOfNavtitle, indexOfReftext]
 */
function getPageContentForExtensionFeatures(page) {
    const contentSum = page.contents.toString()
    let newContent = contentSum.split("\n")
    let indexOfTitle = -1
    let indexOfNavtitle = -1
    let indexOfReftext = -1
    for (let line of newContent) {
        // Find title
        if (line.startsWith("= ") && indexOfTitle < 0) {
            indexOfTitle = newContent.indexOf(line)
        }
        // Find level 2 sections
        // Find optional attribute :navtitle:
        else if (line.startsWith(":navtitle:")) {
            indexOfNavtitle = newContent.indexOf(line)
        }
        // Find optional attribute :reftext:
        else if (line.startsWith(":reftext:")) {
            indexOfReftext = newContent.indexOf(line)
        }
    }
    indexOfTitle = indexOfTitle < 0 ? 0 : indexOfTitle
    return [newContent, indexOfTitle, indexOfNavtitle, indexOfReftext]
}

/**
 * Extracts links by url from an array of items.
 * Function provided by Antora project.
 * @param {Array <Object>} items - The items that need to be analyzed.
 * @param {Object} accum - A previously already aggregated Object of extracted links.
 * @returns {Object} The extracted links.
 */
function getNavEntriesByUrl(items = [], accum = {}) {
    items.forEach((item) => {
        if (item.urlType === 'internal') accum[item.url.split('#')[0]] = item
        getNavEntriesByUrl(item.items, accum)
    })
    return accum
}

/**
 * Determines if a page is publishable, i.e. it does not start with "_" or ".".
 * @param {Object} page - The page that is to be analyzed.
 * @returns {Boolean} States if a page will be published.
 */
function isPublishableFile(page) {
    return (page.src.relative.indexOf("/_") < 0 && page.src.relative.indexOf("/.") < 0 && !page.src.relative.startsWith("_") && !page.src.relative.startsWith("."))
}

/**
 * Determines the page for an xref entry from a line.
 * @param {String} line - The line where the xref macro is located.
 * @param {Integer} indexOfXref - the index of the xref in the line.
 * @param {Array <Object>} pages - An array of all pages.
 * @param {Object} nav - The relevant navigation file.
 * @returns {Object} The matched page.
 */
function determinePageForXrefInLine(line, indexOfXref, pages, nav) {
    const endOfXref = line.indexOf("[")
    const reducedLine = line.substring(indexOfXref + 5, endOfXref)
    let parts = reducedLine.split("@")
    const targetVersion = parts.length > 1 ? parts[0] : nav.src.version
    if (parts.length > 1) {
        parts = parts[1].split(":")
    }
    else {
        parts = parts[0].split(":")
    }
    // const lastColon = reducedLine.lastIndexOf(":")
    // const numberOfColons = (reducedLine.match(/:/g) || []).length
    const numberOfColons = parts.length - 1
    // const targetModule = numberOfColons > 0 ? reducedLine.substring(0,lastColon) : nav.src.module
    const targetModule = numberOfColons > 0 ? parts.at(-2) : nav.src.module
    const targetComponent = numberOfColons > 1 ? parts.at(-3) : nav.src.component
    // const targetFile = reducedLine.slice(lastColon+1)
    const targetFile = parts.at(-1)
    let foundPage = pages.filter(x => x.src.relative === targetFile && x.src.module === targetModule && x.src.component === targetComponent && x.src.version === targetVersion)
    return foundPage
}

/**
 * Generates a map for a regular expression where each matched keyword is an entry and each page it was matched in a value for that entry.
 * @param {RegExp} re - A regular expression that is to be matched for each page.
 * @param {Array <Object>} pages - An array of relevant pages.
 * @param {Boolean} exclusive - Optional: If true, the function will only look for the first match in the file.
 * @returns {Map <String, Object>} A map of matched keywords and the pages where that match occurred.
 */
function generateMapForRegEx(re, pages, exclusive = false) {
    var generatedMap = new Map;
    for (let page of pages.filter((page) => page.out)) {
        var results = []
        for (var line of page.contents.toString().split("\n")) {
            const result = re.exec(line);
            if (result) {
                results.push(result)
                if (exclusive) {
                    break;
                }
            }
        }
        if (results) {
            for (let entry of results) {
                const split_results = entry[1].split(",")
                for (let keyword of split_results) {
                    const keywordTrimmed = keyword.trim()
                    if (generatedMap.has(keywordTrimmed)) {
                        generatedMap = updateMapEntry(generatedMap, keywordTrimmed, page)
                    }
                    else {
                        generatedMap.set(keywordTrimmed, new Set([page]))
                    }
                }
            }
        }
    }
    return (generatedMap)
}

/**
 * Generates a map for the 'keywords' attribute.
 * @param {Boolean} useKeywords - The function is only executed if this is set to true.
 * @param {Array <Object>} pages - An array of relevant pages.
 * @returns {Map <String, Object>} A map of 'keywords' and the pages where they were found in.
 */
function getKeywordPageMapForPages(useKeywords, pages = []) {
    if (!useKeywords) {
        return (new Map())
    }
    var re = new RegExp("^\s*:keywords:(.*)")
    var keywordMap = generateMapForRegEx(re, pages, true)
    return keywordMap
}

/**
 * Generates a map for the 'role' shorthand.
 * @param {Array <Object>} pages - An array of relevant pages
 * @returns {Map <String, Object>} A map of 'roles' and the pages where they were found in.
 */
function getRolePageMapForPages(pages) {
    var re = new RegExp("{role-([^}]*)}")
    var rolesMap = generateMapForRegEx(re, pages)
    return rolesMap
}

/**
 * Generates a map for all anchors with ASAM notation.
 * @param {Array <Object>} catalog - An array of relevant pages and partials.
 * @param {Array <Object>} pages - An array of relevant pages.
 * @param {Array <Object>} navFiles - An array of relevant navigation files.
 * @param {Object} componentAttributes - The attributes defined in the component or site.
 * @returns {Map <String, Object>} A map of anchors and the pages where they were found in.
 */
function getAnchorPageMapForPages(mapInput, catalog, pages, navFiles, componentAttributes) {
    var anchorMap = new Map;
    for (let page of pages.filter((page) => page.out)) {
        let hasPriority = false
        for (let nav of navFiles) {
            if (nav.contents.toString().indexOf(page.src.relative) > -1) {
                hasPriority = true;
                break;
            }
        }
        if (!hasPriority) { continue; }
        let updateMap = getAnchorsFromPageOrPartial(mapInput, catalog, page, componentAttributes, navFiles)
        if (updateMap && updateMap.size > 0) {
            if (hasPriority) {
                anchorMap = mergeAnchorMapEntries(updateMap, anchorMap, navFiles)
            }
            else {
                anchorMap = mergeAnchorMapEntries(anchorMap, updateMap, navFiles)
            }
        }
    }

    return anchorMap
}

/**
 * Updates a map entry by adding a new value to it. Does not work for anchor maps.
 * @param {Map <String, Object>} inputMap - The map that needs to be updated.
 * @param {String} key - The key that is to receive an additional value
 * @param {*} addedValue - The new added value.
 * @returns {Map <String, Object>} The updated map.
 */
const updateMapEntry = (inputMap, key, addedValue) => {
    const newValue = inputMap.get(key).add(addedValue)
    return (inputMap.set(key, newValue))
}

/**
 * Adds or updates an anchor map entry by merging it with another map.
 * @param {Map <String, Object>} anchorMap - The anchor map where one or more entries have to be added.
 * @param {Map <String, Object>} updateMap - An additional anchor map that needs to be merged with the original one.
 * @param {Object} navFiles - An object containing all navigation files.
 * @param {Object} overridePage - Optional: If set, replaces the value for each key in the updateMap with a new set containing the overridePage.
 * @returns {Map <String, Object>} The updated anchor map.
 */
function mergeAnchorMapEntries(anchorMap, updateMap, navFiles, overridePage = null) {
    if (!updateMap || updateMap.size === 0) { return anchorMap }
    const mergedNavFileContent = navFiles.map(a => a.contents.toString()).join("\n")
    for (let key of updateMap.keys()) {
        // const verbose = key == "top-EAID_E5B4C9F4_52A5_4673_9790_6A042A3E3CB0" ? true : false
        if (overridePage) {
            if (updateMap.get(key).usedIn) {
                const newUsedInIndex = mergedNavFileContent.indexOf(overridePage.src.relative)
                // if (verbose) {console.log("newUsedInIndex",newUsedInIndex)}
                if (newUsedInIndex === -1) {
                    updateMap.get(key).usedIn.push(overridePage)
                    updateMap.get(key).usedInLine.push(updateMap.get(key).line)
                }
                else {
                    for (let index in updateMap.get(key).usedIn) {
                        const currentUsedInIndex = mergedNavFileContent.indexOf(updateMap.get(key).usedIn[index])
                        // if (verbose){console.log(index, currentUsedInIndex, updateMap.get(key).usedIn[index])}
                        if (currentUsedInIndex === -1 || currentUsedInIndex > newUsedInIndex) {
                            updateMap.get(key).usedIn.splice(index, 0, overridePage)
                            updateMap.get(key).usedInLine.splice(index, 0, updateMap.get(key).line)
                            break;
                        }
                        if (index === updateMap.get(key).usedIn.length - 1) {
                            updateMap.get(key).usedIn.push(overridePage)
                            updateMap.get(key).usedInLine.push(updateMap.get(key).line)
                            break;
                        }
                    }
                }
            }
            else {
                updateMap.get(key).usedIn = [overridePage]
                updateMap.get(key).usedInLine = [updateMap.get(key).line]
            }
        }
        if (anchorMap.get(key)) {
            if (anchorMap.get(key).usedIn && updateMap.get(key).usedIn) {
                anchorMap.get(key).usedIn = anchorMap.get(key).usedIn.concat(updateMap.get(key).usedIn)
                anchorMap.get(key).usedInLine = anchorMap.get(key).usedInLine.concat(updateMap.get(key).usedInLine)
            } else if (anchorMap.get(key).usedIn) {
                anchorMap.get(key).usedIn.push(updateMap.get(key).source)
                anchorMap.get(key).usedInLine.push(updateMap.get(key).line)
            } else if (updateMap.get(key).usedIn) {
                anchorMap.get(key).usedIn = [anchorMap.get(key).source].concat(updateMap.get(key).usedIn)
                anchorMap.get(key).usedInLine = [anchorMap.get(key).line].concat(updateMap.get(key).usedInLine)
            }
            else {
                anchorMap.get(key).usedIn = [anchorMap.get(key).source].concat([updateMap.get(key).source])
                anchorMap.get(key).usedInLine = [anchorMap.get(key).line].concat([updateMap.get(key).line])
            }
        }
        else {
            anchorMap.set(key, updateMap.get(key))
        }
    }
    return anchorMap
}


/**
 * Creates a sorted and merged file with all navigation files' content.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'navFiles'.
 * @returns {String} The sorted and merged navigation files content
 */
function createdSortedNavFileContent(mapInput) {
    let mergedNavContents = []
    for (let nav of mapInput.navFiles.sort((a, b) => {
        return a.nav.index - b.nav.index
    })) {
        const newNavContent = nav.contents.toString().split("\n")
        mergedNavContents = mergedNavContents.concat(newNavContent)
    }
    return mergedNavContents.join("\n")
}

/**
 * Generator for all relevant maps.
 * This function generates maps for keywords, roles, and anchors.
 * @param {Object} mapInput - A set of configuration parameters relevant for the map generator. Must contain 'useKeywords', 'pages', and 'navFiles'.
 * @returns {Object} Object containing the determined maps: keywordPageMap, rolePageMap, anchorPageMap.
 */
function generateMapsForPages(mapInput) {
    const keywordPageMap = getKeywordPageMapForPages(mapInput.useKeywords, mapInput.pages)
    const rolePageMap = getRolePageMapForPages(mapInput.pages)
    let anchorPageMap = getAnchorPageMapForPages(mapInput, mapInput.contentCatalog, mapInput.pages, mapInput.navFiles, mapInput.componentAttributes)
    const mergedNavContents = createdSortedNavFileContent(mapInput)

    anchorPageMap = indexifyAnchorMap(anchorPageMap, mergedNavContents)
    return { keywordPageMap, rolePageMap, anchorPageMap }
}

function indexifyAnchorMap(anchorPageMap, mergedNavContents) {
    anchorPageMap.forEach((value, key) => {
        const debug = key.includes("EAID_898D9CC9_ADA9_4992_9AB8_C13AE98C756A")
        value.index = [mergedNavContents.indexOf(value.source.src.relative), value.line]
        value.allIndices = [[mergedNavContents.indexOf(value.source.src.relative), value.line]]
        if (value.usedIn) {
            for (const [index, element] of value.usedIn.entries()) {
                const navIndex = mergedNavContents.indexOf(element.src.relative)
                value.allIndices.push([navIndex, value.usedInLine[index]])
                if (value.index[0] === -1 || (navIndex > -1 && navIndex < value.index[0])) {
                    value.index = [navIndex, value.usedInLine[index]]
                } else if (navIndex === value.index[0] && value.usedInLine[index] < value.index[1]) {
                    value.index[1] = value.usedInLine[index]
                }
            }
            value.usedIn = [value.source].concat(value.usedIn)
            let sortedEntries = value.usedIn.map((v, i) => { return [v, value.allIndices[i]] })
            sortedEntries.sort((a, b) => {
                if (a[1][0] === b[1][0]) { return a[1][1] - b[1][1]} 
                if (a[1][0] === -1) { return 1} 
                if (b[1][0] === -1) { return -1} 
                return a[1][0] - b[1][0]
            })
            value.usedIn = sortedEntries.map(v => v[0])
            value.allIndices = sortedEntries.map(v => v[1])
        }
        else {
            value.usedIn = [value.source]
        }
    })

    anchorPageMap = new Map(([...anchorPageMap]).sort((a, b) => {
        const indexA = a[1].index[0]
        const indexB = b[1].index[0]
        if (indexA === -1 && indexB === -1) {
            return 0
        }
        if (indexA === -1) {
            return 1
        }
        if (indexB === -1) {
            return -1
        }
        if (indexA === indexB) {
            return Math.sign(a[1].index[1] - b[1].index[1])
        }
        return Math.sign(indexA - indexB)
    }))

    // Filter the map entries with an index of -1
    anchorPageMap = new Map(([...anchorPageMap]).filter(x => x[1].index[0] !== -1))
    return anchorPageMap
}

/**
 * Determines the file the link of an include is pointing to in case this is a partial with Antora url.
 * @param {Array <Object>} contentFiles - An array of all relevant files.
 * @param {Object} thisPage - The current page.
 * @param {String} pathPrefix - A prefix for the path, as determined from the include macro.
 * @param {String} includePath - The path after the prefix, as determined from the include macro.
 * @returns {Object} The determined partial, if any.
 */
function determineTargetPartialFromIncludeMacro(contentFiles, thisPage, pathPrefix, includePath) {
    const prefixParts = pathPrefix.split(":")
    const targetModule = prefixParts.length > 1 ? prefixParts.at(-2) : thisPage.src.module
    const targetComponent = prefixParts.length > 2 ? prefixParts.at(-3) : thisPage.src.component
    const targetFamily = prefixParts.at(-1) === "page$" ? "page" : "partial"
    return contentFiles.find(file => file.src.family === targetFamily && file.src.module === targetModule && file.src.component === targetComponent && file.src.relative === includePath)
}

/**
 * Looks for the include macro and tries to identify the corresponding page or partial (.adoc).
 * @param {Object} catalog - A content catalog with all relevant content (files and attributes).
 * @param {Object} thisFile - The current file.
 * @param {String} line - The line that needs to be analyzed.
 * @returns {Object} The identified target file.
 */
function checkForIncludedFileFromLine(catalog, thisFile, line) {
    let targetFile;
    const re = /^\s*include::((\S*partial\$)|(\S*page\$))?([^\[]+\.adoc)\[[^\]]*\]/
    const match = line.match(re)
    if (match) {
        const includePath = match[4]
        if (match[2]) {
            const prefixParts = match[1].split(":")
            targetFile = catalog.find(file => file.src.family === "partial" && file.src.module === prefixParts.length > 1 ? prefixParts.at(-2) : thisFile.src.module && file.src.relative === includePath)
        }
        else if (match[3]) {
            const prefixParts = match[1].split(":")
            targetFile = catalog.find(file => file.src.family === "page" && file.src.module === prefixParts.length > 1 ? prefixParts.at(-2) : thisFile.src.module && file.src.relative === includePath)
        }
        else {
            targetFile = determineTargetPageFromIncludeMacro(catalog, thisFile, includePath, false)
        }

    }
    return targetFile
}

/**
 * Tries to retrieve the value of an attribute from a file (first occurrence). Returns null if no match is found.
 * @param {Object} file - The file to be analyzed.
 * @param {String} attribute - The attribute in question.
 * @param {Integer} stopAfter - Optional: Defines a maximum number of lines to search before stopping.
 * @returns {*} The identified attribute value, if found, or null, if not.
 */
function getAttributeFromFile(file, attribute, stopAfter = 0) {
    if (typeof attribute == 'string' || attribute instanceof String) {
        let attributes = {}
        let i = 0
        for (let line of file.contents.toString().split("\n")) {
            if (stopAfter > 0 && i > stopAfter) { break; }
            updatePageAttributes(attributes, line)
            if (attribute in attributes) {
                return attributes[attribute]
            }
            i++;
        }
    }
    return null
}

/**
 * Tries to retrieve the value of an attribute from a content Array (first occurrence). Returns null if no match is found.
 * @param {Array <String>} content - An Array of String containing a file's content.
 * @param {String} attribute  - An attribute name.
 * @param {Integer} stopAfter - Optional: A maximum number of lines to search.
 * @returns {*} The value of the requested attribute, if found, or null, if not.
 */
function getAttributeFromContent(content, attribute, stopAfter = 0) {
    if (typeof attribute == 'string' || attribute instanceof String) {
        if (typeof content == 'string' || content instanceof String) {
            content = content.split("\n")
        }
        let attributes = {}
        let i = 0
        for (let line of content) {
            if (stopAfter > 0 && i > stopAfter) { break; }
            updatePageAttributes(attributes, line)
            if (attribute in attributes) {
                return attributes[attribute]
            }
            i++;
        }
    }
    return null
}

/**
 * Determines the path to a source file from an Antora ID.
 * @param {String} fileId - The ID of an Antora file.
 * @returns {String} The translated path to the file.
 */
function getSrcPathFromFileId(fileId) {
    let splitFileId = fileId.split("@")
    let version,
        component,
        antoraModule,
        type,
        relative

    if (splitFileId.length === 2) {
        version = splitFileId[0]
        splitFileId.shift()
    }

    splitFileId = splitFileId[0].split(":")
    if (splitFileId.length == 3) {
        component = splitFileId[0]
        splitFileId.shift()
    }
    if (splitFileId.length == 2) {
        antoraModule = splitFileId[0]
        splitFileId.shift()
    }
    splitFileId = splitFileId[0].split("$")
    if (splitFileId.length === 2) {
        type = splitFileId[0]
        splitFileId.shift()
    }
    relative = splitFileId[0]
    function fullPath(self) {
        const version = self.version ? self.version + "/" : ""
        const component = self.component ? self.component + "/" : ""
        const module = self.module ? self.module * "/" : ""
        const type = self.type ? self.type * "/" : ""
        return component + version + module + self.relative
    }
    return { version: version, component: component, module: antoraModule, type: type, relative: relative }
}

/**
 * Determines for an anchor found in a given file whether it is related to a listing block.
 * @param {Object} file - The file where the anchor is located in.
 * @param {String} anchor - The anchor in question
 * @returns {Boolean} Whether the anchor is a listing block.
 */
function isListingBlock(file, anchor) {
    const reSourceBlock = /^\[source([^\]]+)?\]\s*\n-{4}\s*$/m
    const regexAnchor = anchor.replaceAll("-", "\\-").replaceAll(".", "\\.").replaceAll("(", "\\(").replaceAll(")", "\\)")
    const reAnchor = new RegExp(`\\[\\[{1,2}${regexAnchor}(,([^\\]]*))?\\]\\]|\\[\#${regexAnchor}(,([^\\]]*))?\\]|anchor:${regexAnchor}(,([^\\]]*))?`, 'm')
    const content = file.contents.toString()
    const start = content.match(reAnchor) ? content.match(reAnchor).index : null
    if (!start) { return false }
    const match = content.slice(start).match(reSourceBlock)
    if (!match) { return false }
    const end = match.index
    // console.log("is listing: ",content.slice(start,start+end).split("\n").length === 3); console.log(content.slice(start,start+end).split("\n"), content.slice(start,start+end).split("\n").length)
    return (content.slice(start, start + end).split("\n").length === 3)
}

/**
 * Determines for an anchor found in a given file whether it is related to an example block.
 * @param {Object} file - The file where the anchor is located in.
 * @param {String} anchor - The anchor in question
 * @returns {Boolean} Whether the anchor is an example block.
 */
function isExampleBlock(file, anchor) {
    const reExampleBlock = /^(\[source([^\]]+)?\]\s*\n)?={4}$/m
    const regexAnchor = anchor.replaceAll("-", "\\-").replaceAll(".", "\\.").replaceAll("(", "\\(").replaceAll(")", "\\)")
    const reAnchor = new RegExp(`\\[\\[{1,2}${regexAnchor}(,([^\\]]*))?\\]\\]|\\[\#${regexAnchor}(,([^\\]]*))?\\]|anchor:${regexAnchor}(,([^\\]]*))?`, 'm')
    const content = file.contents.toString()
    const start = content.match(reAnchor) ? content.match(reAnchor).index : null
    if (!start) { return false }
    const match = content.slice(start).match(reExampleBlock)
    if (!match) { return false }
    const end = match.index
    // console.log("is example: ",content.slice(start,start+end).split("\n").length === 3); console.log(content.slice(start,start+end).split("\n"), content.slice(start,start+end).split("\n").length)
    return (content.slice(start, start + end).split("\n").length === 3)
}

module.exports = {
    determineTargetPageFromIncludeMacro,
    getAllKeywordsAsArray,
    getReferenceNameFromSource,
    determinePageForXrefInLine,
    getPageContentForExtensionFeatures,
    isPublishableFile,
    getNavEntriesByUrl,
    generateMapsForPages,
    getKeywordPageMapForPages,
    determineTargetPartialFromIncludeMacro,
    updatePageAttributes,
    replaceAllAttributesInLine,
    getAnchorsFromPageOrPartial,
    checkForIncludedFileFromLine,
    getAttributeFromFile,
    getSrcPathFromFileId,
    getAttributeFromContent,
    isExampleBlock,
    isListingBlock,
    createdSortedNavFileContent,
    getMergedFileContent,
    getTargetFileOverAllContent,
    preventLatexMathConversion,
    indexifyAnchorMap,
    getTopAnchorValues,
    applyStyleForXrefLabel
}