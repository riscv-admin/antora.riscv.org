'use strict'
//-------------
//-------------
// Module for the custom ASAM bibtex extension.
// This module provides two central functions, 'getBibliographyFiles', that retrieves and parses the specified bibliography files, and 'applyBibliography', that applies the citations and the bibliography macro.
// This extension currently only supports IEEE style citation for books and proceedings.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require('../../core/content_analyzer.js')
const CSL = require('citeproc')
const {Cite} = require("@citation-js/plugin-bibtex/node_modules/@citation-js/core");
require("@citation-js/plugin-bibtex")
const fs = require('fs')
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const jsdom = require('jsdom')

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }
  

/**
 * Replaces all cite:[] macros with links and the bibliography::[] with a sorted list of referenced bibliography entries.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'componentAttributes', 'pages', 'version', 'navFiles'.
 * @param {Array <Object>} bibliographyFiles - An array of all bibliography (.bib) files, one per component & version.
 * @param {String} styleID - The name of the style (csl) that is to be applied for the bibliography.
 * @param {String} language - The language used for the bibliography (using locale).
 */
function applyBibliography(mapInput, bibliographyFiles, styleID = "ieee", language = "en") {
    if (!mapInput.componentAttributes['asamBibliography']) {return}
    // Set up regular expressions
    const reException = /ifndef::use-antora-rules\[\](.*\r*\n*)*?endif::\[\]/gm
    const reBibliography = /^\s*bibliography::\[\]/gm
    // let antoraBibliography, lineInNavigation, relevantNavFile

    // // Find relevant bibliography file and bibliography page
    // for (let nav of mapInput.navFiles) {
    //     let contents = nav.contents.toString().split("\n")
    //     for (let line of contents.reverse()) {
    //         const match = line.match(/\** *(xref:.+\[.*\])/)
    //         if (match) {
    //             const bibMatchCandidate = ContentAnalyzer.determinePageForXrefInLine(match[1], 0, mapInput.catalog, nav)
    //             if (bibMatchCandidate.contents.toString().match("bibliography::[]") && !)
    //             if (bibMatch && bibMatch[0] === antoraBibliography) {
    //                 contents = contents.replace(match[0], "").replace("[bibliography]","")
    //                 nav.contents = Buffer.from(contents)
    //                 antoraBibliography.contents = Buffer.from("")
    //                 antoraBibliography.out = null
    //                 return
    //             }
    //         }
    //     }
    // }
    const antoraBibliography = mapInput.pages.find(x => x.contents.toString().replaceAll(reException,``).match(reBibliography))
    console.log("found bibliography adoc file",antoraBibliography)
    const bibFile = bibliographyFiles.find(x => x.component === mapInput.component && x.version === mapInput.version)
    if (!bibFile) {throw "No .bib file found!"}
    if (!antoraBibliography) {throw "Found .bib file but no page with 'bibliography::[]'!"}

    // Set up bibliography data
    const bibEntries = new Cite(bibFile.file.contents.toString())
    const citeprocSys = {
        retrieveLocale: function (lang){
            try {
                return fs.readFileSync(`${__dirname}/lib/locales/locales-${lang}.xml`, 'utf8')
            }
            catch {
                try {
                    console.log("Submodule for csl locale not found. Falling back to remote.")
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://raw.githubusercontent.com/Juris-M/citeproc-js-docs/master/locales-' + lang + '.xml', false);
                    xhr.send(null);
                    return xhr.responseText;
                }
                catch {
                    return false
                }
            }
        },
        retrieveItem: function(id){
          return bibEntries.data.find((x) => {
            return x.id === id
          })
        }
      }
    let style
    try {
        style = fs.readFileSync(`${__dirname}/lib/styles/${styleID}.csl`, 'utf8')
    }
    catch {
        console.log("Submodule for csl styles not found. Falling back to remote.")
        let xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://raw.githubusercontent.com/citation-style-language/styles/master/' + styleID + '.csl', false);
        xhr.send(null);
        style = xhr.responseText;
    }
    const citeproc = new CSL.Engine(citeprocSys, style, language, true)
     citeproc.updateItems(bibEntries.data.map(x => {return x.id}))
    // Sort pages by entry in navigation
    const mergedNavContent = ContentAnalyzer.createdSortedNavFileContent(mapInput)
    mapInput.pages.sort((a,b) => {
        const indexA = a.src.relative === "index.adoc" ? 0 : mergedNavContent.indexOf(a.src.relative) === -1 ? -1 : mergedNavContent.indexOf(a.src.relative) + 1
        const indexB = b.src.relative === "index.adoc" ? 0 : mergedNavContent.indexOf(b.src.relative) === -1 ? -1 : mergedNavContent.indexOf(b.src.relative) + 1

        if (indexA === indexB) {return 0}
        if (indexA === -1) {return 1}
        if (indexB === -1) {return -1}
        return indexA - indexB
    })

    // Identify the references actually used throughout this document and replace them with links
    const pathToId = `${antoraBibliography.src.module}:${antoraBibliography.src.relative}`
    let citationsPre = []
    let linkReplacements = {}
    // Replace cite macro with citation id. This also orders the entries according to the style
    mapInput.pages.forEach(page => {
        replaceCitationsWithLinks({ page: page })
    })
    // Replace citation id with final name (this can change during the first iteration, thus we need to go over it again.)
    mapInput.pages.forEach(page => {
        replaceCitationsWithLinks({ page: page, final: true })
    })
    // Create bibliography page
    const status = createBibliography(antoraBibliography, citeproc)
    if (!status) {
        for (let nav of mapInput.navFiles) {
            let contents = nav.contents.toString()
            const match = contents.match(/\** *(xref:.*bibliography.adoc\[.*\])/)
            if (match) {
                const bibMatch = ContentAnalyzer.determinePageForXrefInLine(match[1], 0, mapInput.catalog, nav)
                if (bibMatch && bibMatch[0] === antoraBibliography) {
                    contents = contents.replace(match[0], "").replace("[bibliography]","")
                    nav.contents = Buffer.from(contents)
                    antoraBibliography.contents = Buffer.from("")
                    antoraBibliography.out = null
                    return
                }
            }
        }
    }

    /**
     * Replaces all citations within a file by the respective link to the bibliography page. Also processes included pages and partials.
     * @param {Object} page - The file where the citations are to be replaced.
     * @param {Array <>} citationsPre - Optional: The citations already made in previous files and lines.
     * @param {Object} pageAttributes - Optional: The collective page attributes.
     */
    function replaceCitationsWithLinks({page, pageAttributes = {}, final = false} = {}) {
        const reReference = /(?<!\/{2} .*)cite:\[([^\]]+)\]/g
        const reLineReplacement = /bibrefid-([^\]]+)/g
        let fileContentReplaced = page.contents.toString().replaceAll(reException,``).split("\n")
        let fileContent = page.contents.toString()
        const cslCitationPrefix = citeproc.cslXml.dataObj.children.find(x => x.name==="citation").children.find(x => x.name === "layout").children[0].attrs.prefix
        const cslCitationSuffix = citeproc.cslXml.dataObj.children.find(x => x.name==="citation").children.find(x => x.name === "layout").children[0].attrs.suffix
        const prefix = citeproc.citation.opt.layout_prefix ? citeproc.citation.opt.layout_prefix : cslCitationPrefix ? cslCitationPrefix : ""
        const suffix = citeproc.citation.opt.layout_suffix ? citeproc.citation.opt.layout_suffix : cslCitationSuffix ? cslCitationSuffix : ""
        const reIdentifier = new RegExp(`^${escapeRegExp(prefix)}(.+)${escapeRegExp(suffix)}$`)
        for (let line of fileContentReplaced) {
            // Check for included file and apply function to that if found. Update the currentIndex accordingly
            ContentAnalyzer.updatePageAttributes(pageAttributes,line)
            const lineWithoutAttributes = ContentAnalyzer.replaceAllAttributesInLine(mapInput.componentAttributes, pageAttributes, line)
            const includedFile = ContentAnalyzer.checkForIncludedFileFromLine(mapInput.catalog,page,lineWithoutAttributes)
            if (includedFile) {
                replaceCitationsWithLinks({page: includedFile, pageAttributes: pageAttributes, final: final})
            }
            let result = line;
            if (!final) {
            const matches = [...line.matchAll(reReference)]
            for (let m of matches){
                // If a match was found and an entry in the bib file exists                
                if (m[1] && citeprocSys.retrieveItem(m[1])) {
                    // If it has no number yet, generate one
                    const citation = {citationItems: [{id: m[1]}]}
                    const cited = citeproc.processCitationCluster(citation, citationsPre, [])
                    citationsPre.push([cited[1].at(-1)[2], cited[1].at(-1)[0]])
                    const subst = cited[1].at(-1)[1].replace(reIdentifier,`${prefix}xref:${pathToId}#bib-${m[1]}[bibrefid-${cited[1].at(-1)[2]}]${suffix}`);
                    for (let c of cited[1]) {
                        linkReplacements[c[2]] = c[1].replace(reIdentifier, "$1").replace(/<i>(.+)<\/i>/, "__$1__").replace(/<b>(.+)<\/b>/, "**$1**")
                    }
                    result = result.replace(m[0], subst);
                }
                // If there is a match but no entry in the bib file
                else if (m[1]) {
                    console.log("Could not find bibliography entry for",m[1])
                }
            }
            fileContent = fileContent.replace(line,result)
            fileContentReplaced[fileContentReplaced.indexOf(line)] = result
            } else {
                const matches = [...line.matchAll(reLineReplacement)]
                for (let m of matches){
                    result = result.replace(m[0], linkReplacements[m[1]])
                }
                fileContent = fileContent.replace(line,result)
                fileContentReplaced[fileContentReplaced.indexOf(line)] = result
            }
        }

        page.contents = Buffer.from(fileContent)
    }

    /**
     * Creates the bibliography page from the indexed bibEntries.
     * @param {Object} antoraBibliography - The (first) file with the bibliography::[] macro in this component-version.
     * @param {Object} bibEntries - An object containing all entries of the bibliography (using the bibtex library), annotated with indices. 
     * @param {Array <String>} itemIDs - An ordered array containing the items of the bibliography that were used throughout the documentation.
     * @param {Object} citeproc - The citeproc object for creating the bibliography based on the defined style.
     */
    function createBibliography(antoraBibliography, citeproc) {
        // Sort entries by index
        console.log("Creating bibliography")
        const result = citeproc.makeBibliography()
        console.log("result", result)
        if (!result) {
            console.log("Cannot create bibliography")
            return false
        }
        let content = antoraBibliography.contents.toString()
        let replacementContent = ["\n"]
        let dom = new jsdom.JSDOM(`<!DOCTYPE html>${result[1].join("").replaceAll("\n","").replaceAll(/> +</g,"><")}`)
        const entries = dom.window.document.getElementsByClassName("csl-entry")
        result[0].entry_ids.forEach((id, index) => {
            const identifier = entries[index].getElementsByClassName("csl-left-margin")[0] ? entries[index].getElementsByClassName("csl-left-margin")[0] : null
            const text = entries[index].getElementsByClassName("csl-right-inline")[0] ? entries[index].getElementsByClassName("csl-right-inline")[0] : null
            if (identifier && text) {
                replacementContent.push(`[[bib-${id[0]}]]${identifier.innerHTML} pass:m,p[${text.innerHTML.replaceAll("]","\\]")}]`)
            } else {
                replacementContent.push(`[[bib-${id[0]}]]pass:m,p[${entries[index].innerHTML.replaceAll("]","\\]")}]`)
            }
        })
        replacementContent = replacementContent.join("\n\n")
        const newContent = content.replace("bibliography::[]",replacementContent)
        antoraBibliography.contents = Buffer.from(newContent)
        console.log("Bibliography updated")
        console.log(newContent)
        return true
    }
}

/**
 * Retrieves and parses the .bib files.
 * @param {Object} contentAggregate - The contentAggregate variable from Antora.
 * @returns {Array} All found bibliography files as objects in an array, each entry consisting of "component", "version", and "file"
 */
function getBibliographyFiles(contentAggregate) {
    let bibliographyFiles = []
    contentAggregate.forEach(v => {
        if(v.asciidoc && v.asciidoc.attributes.asamBibliography) {
            const pathToBibFile = ContentAnalyzer.getSrcPathFromFileId(v.asciidoc.attributes.asamBibliography)
            bibliographyFiles.push({component:v.name, version:v.version, file: v.files.find(x => x.src.path && x.src.path.includes(pathToBibFile.relative))})
        }
    })
    return bibliographyFiles
}

module.exports = {
    applyBibliography,
    getBibliographyFiles
}
