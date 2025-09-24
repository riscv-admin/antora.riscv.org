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
const {parseBibFile, normalizeFieldValue} = require("bibtex")

/**
 * Replaces all cite:[] macros with links and the bibliography::[] with a sorted list of referenced bibliography entries.
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'componentAttributes', 'pages', 'version', 'navFiles'.
 * @param {Array <Object>} bibliographyFiles - An array of all bibliography (.bib) files, one per component & version.
 */
function applyBibliography(mapInput, bibliographyFiles) {
    if (!mapInput.componentAttributes['asamBibliography']) {return}    
    // Set up regular expressions
    const reException = /ifndef::use-antora-rules\[\](.*\r\n*)*?endif::\[\]/gm
    const reBibliography = /^\s*bibliography::\[\]/gm

    // Find relevant bibliography file and bibliography page
    const antoraBibliography = mapInput.pages.find(x => x.contents.toString().replaceAll(reException,``).match(reBibliography))
    const bibFile = bibliographyFiles.find(x => x.component === mapInput.component && x.version === mapInput.version)
    if (!bibFile) {throw "No .bib file found!"}
    if (!antoraBibliography) {throw "Found .bib file but no page with 'bibliography::[]'!"}
    // Remove @Comment lines since they do not work with this lib
    let bibFileContents = bibFile.file.contents.toString().replaceAll(/^ *@Comment\{.+$/gm,'')
    let bibEntries = parseBibFile(bibFileContents)

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
    let currentIndex = 1
    mapInput.pages.forEach(f => {
        currentIndex = replaceCitationsWithLinks(f, reException, mapInput, bibEntries, currentIndex, pathToId)
    })

    // Create bibliography page
    createBibliography(antoraBibliography, bibEntries)
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

/**
 * Replaces all citations within a file by the respective link to the bibliography page. Also processes included pages and partials.
 * @param {Object} f - The file where the citations are to be replaced.
 * @param {String} reException - The regular expression for content that is to be excepted from replacement (e.g. in comments).
 * @param {Object} mapInput - A set of configuration parameters. Must contain 'catalog'.
 * @param {Object} bibEntries - An object containing all entries of the bibliography (using the bibtex library).
 * @param {Integer} currentIndex - The current index for new bibtex references.
 * @param {String} pathToId - The path to the identified bibliography page.
 * @returns {Integer} - The current index after processing the file.
 */
function replaceCitationsWithLinks(f, reException, mapInput, bibEntries, currentIndex, pathToId, pageAttributes = {}) {
    const reReference = /(?<!\/{2} .*)cite:\[([^\]]+)\]/g
    let fileContentReplaced = f.contents.toString().replaceAll(reException,``).split("\n")
    let fileContent = f.contents.toString()
    for (let line of fileContentReplaced) {
        // Check for included file and apply function to that if found. Update the currentIndex accordingly
        ContentAnalyzer.updatePageAttributes(pageAttributes,line)
        const lineWithoutAttributes = ContentAnalyzer.replaceAllAttributesInLine(mapInput.componentAttributes, pageAttributes, line)
        const includedFile = ContentAnalyzer.checkForIncludedFileFromLine(mapInput.catalog,f,lineWithoutAttributes)
        if (includedFile) {
            currentIndex = replaceCitationsWithLinks(includedFile, reException, mapInput, bibEntries, currentIndex, pathToId, pageAttributes)
        }
        let result = line;
        const matches = [...line.matchAll(reReference)]
        for (let m of matches){
            if (m[1] && bibEntries.getEntry(m[1].toLowerCase())) {
                if (!bibEntries.entries$[m[1].toLowerCase()].index) {
                    bibEntries.entries$[m[1].toLowerCase()].index = currentIndex
                    currentIndex++
                }
                const subst = `[xref:${pathToId}#bib-${m[1].toLowerCase()}[${bibEntries.entries$[m[1].toLowerCase()].index}]]`;
                result = result.replace(m[0], subst);
            }
            else if (m[1]) {
                console.log("Could not find bibliography entry for",m[1])
            }
        }
        fileContent = fileContent.replace(line,result)
        fileContentReplaced[fileContentReplaced.indexOf(line)] = result
    }

    // f.contents = Buffer.from(fileContentReplaced.join("\n"))    
    f.contents = Buffer.from(fileContent)
    return currentIndex
}

/**
 * Creates the bibliography page from the indexed bibEntries.
 * @param {Object} antoraBibliography - The (first) file with the bibliography::[] macro in this component-version.
 * @param {Object} bibEntries - An object containing all entries of the bibliography (using the bibtex library), annotated with indices. 
 */
function createBibliography(antoraBibliography, bibEntries) {
    // Sort entries by index
    let bibContent = []
    for (let key of Object.keys(bibEntries.entries$)) {
        bibContent.push(convertBibliographyEntry(key, bibEntries.entries$[key]))
    }
    bibContent = bibContent.filter(x => x[0] && x[0] !== "undefined").sort((a,b) => {
        return a[0] - b[0]
    })
    const replacementContent = "\n"+bibContent.map(x => x[1]).join("\n\n")
    let content = antoraBibliography.contents.toString()
    const newContent = content.replace("bibliography::[]",replacementContent)
    antoraBibliography.contents = Buffer.from(newContent)
}

/**
 * Converts a bibliography entry into AsciiDoc. Supports types 'book' and 'proceedings' with IEEE citation style.
 * @param {*} key - The key for the entry.
 * @param {*} e - The entry itself (bibtex library format).
 * @returns {Array <Integer,String>} - An array containing the element's index and the created string.
 */
function convertBibliographyEntry(key, e) {
    let entryIndex = `[[bib-${key}]][${e.index}]`;
    let body = []
    let suffix = []
    // Create an entry based on its type. Each entry consists of an index ([[anchor]] [index]), a body (where all parts are joined by commas), and a suffix (separated by a dot from the body, then joined by commas). 
    // Typically, the entry is terminated with a dot, unless the last entry is the URL field.
    switch (e.type) {
        case 'book':
            if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)}
            else if (e.getField("EDITOR")) {body.push(`${getEditors(normalizeFieldValue(e.getField("EDITOR")))}`)};
            if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)};
            if (e.getField("VOLUME")) {body.push(`vol. ${normalizeFieldValue(e.getField("VOLUME"))}`)};
            if (e.getField("NUMBER")) {body.push(`no. ${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("SERIES")) {body.push(`${normalizeFieldValue(e.getField("SERIES"))}`)};
            if (e.getField("EDITOR") && !e.getField("AUTHOR")) {body.push(`${getEditors(normalizeFieldValue(e.getField("EDITOR")))}`)};
            if (e.getField("EDITION")) {body.push(`${normalizeFieldValue(e.getField("EDITION"))} ed.`)};
            if (e.getField("ADDRESS")) {suffix.push(`${normalizeFieldValue(e.getField("ADDRESS"))}:`)};
            if (e.getField("PUBLISHER")) {suffix.push(`${normalizeFieldValue(e.getField("PUBLISHER"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            if (e.getField("PAGES")) {suffix.push(`pp. ${normalizeFieldValue(e.getField("PAGES"))}`)};
            // if (e.getField("NOTE")) {suffix.push(`${normalizeFieldValue(e.getField("NOTE"))}`)};
            if (e.getField("URL")) {suffix.push(`Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'inbook':
            if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)};
            if (e.getField("CHAPTER") && e.getField("TITLE")) {body.push(`"${normalizeFieldValue(e.getField("CHAPTER"))}" in __${normalizeFieldValue(e.getField("TITLE"))}__`)}
            else if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)};
            if (e.getField("VOLUME")) {body.push(`vol. ${normalizeFieldValue(e.getField("VOLUME"))}`)};
            if (e.getField("NUMBER")) {body.push(`no. ${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("SERIES")) {body.push(`${normalizeFieldValue(e.getField("SERIES"))}`)};
            if (e.getField("EDITION")) {body.push(`${normalizeFieldValue(e.getField("EDITION"))} ed.`)};
            if (e.getField("ADDRESS")) {suffix.push(`${normalizeFieldValue(e.getField("ADDRESS"))}:`)};
            if (e.getField("PUBLISHER")) {suffix.push(`${normalizeFieldValue(e.getField("PUBLISHER"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            if (e.getField("PAGES")) {suffix.push(`pp. ${normalizeFieldValue(e.getField("PAGES"))}`)};
            // if (e.getField("NOTE")) {suffix.push(`${normalizeFieldValue(e.getField("NOTE"))}`)};
            // if (e.getField("TYPE")) {suffix.push(`${normalizeFieldValue(e.getField("TYPE"))}`)};
            if (e.getField("URL")) {suffix.push(`Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'proceedings':
            if (e.getField("EDITOR")) {body.push(`${getEditors(normalizeFieldValue(e.getField("EDITOR")))}`)};
            if (e.getField("TITLE") && e.getField("BOOKTITLE")) {body.push(`"${normalizeFieldValue(e.getField("TITLE"))}" in __${normalizeFieldValue(e.getField("BOOKTITLE"))}__`)}
            else if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)}
            else if (e.getField("BOOKTITLE")) {body.push(`__${normalizeFieldValue(e.getField("BOOKTITLE"))}__`)};
            if (e.getField("VOLUME")) {body.push(`vol. ${normalizeFieldValue(e.getField("VOLUME"))}`)};
            if (e.getField("NUMBER")) {body.push(`no. ${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("SERIES")) {body.push(`${normalizeFieldValue(e.getField("SERIES"))}`)};
            if (e.getField("ADDRESS")) {suffix.push(`${normalizeFieldValue(e.getField("ADDRESS"))}:`)};
            if (e.getField("PUBLISHER")) {suffix.push(`${normalizeFieldValue(e.getField("PUBLISHER"))}`)};
            if (e.getField("ORGANIZATION")) {suffix.push(`${normalizeFieldValue(e.getField("ORGANIZATION"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            if (e.getField("PAGES")) {suffix.push(`pp. ${normalizeFieldValue(e.getField("PAGES"))}`)};
            // if (e.getField("NOTE")) {suffix.push(`${normalizeFieldValue(e.getField("NOTE"))}`)};
            if (e.getField("ANNOTE")) {suffix.push(`${normalizeFieldValue(e.getField("ANNOTE"))}`)};
            if (e.getField("URL")) {suffix.push(`Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'inproceedings':
            if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)};
            if (e.getField("TITLE") && e.getField("BOOKTITLE")) {body.push(`"${normalizeFieldValue(e.getField("TITLE"))}" in __${normalizeFieldValue(e.getField("BOOKTITLE"))}__`)}
            else if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)}
            else if (e.getField("BOOKTITLE")) {body.push(`__${normalizeFieldValue(e.getField("BOOKTITLE"))}__`)};
            if (e.getField("VOLUME")) {body.push(`vol. ${normalizeFieldValue(e.getField("VOLUME"))}`)};
            if (e.getField("NUMBER")) {body.push(`no. ${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("SERIES")) {body.push(`${normalizeFieldValue(e.getField("SERIES"))}`)};
            if (e.getField("EDITOR")) {body.push(`${getEditors(normalizeFieldValue(e.getField("EDITOR")))}`)};
            if (e.getField("ADDRESS")) {suffix.push(`${normalizeFieldValue(e.getField("ADDRESS"))}:`)};
            if (e.getField("PUBLISHER")) {suffix.push(`${normalizeFieldValue(e.getField("PUBLISHER"))}`)};
            if (e.getField("ORGANIZATION")) {suffix.push(`${normalizeFieldValue(e.getField("ORGANIZATION"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {suffix.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            if (e.getField("PAGES")) {suffix.push(`pp. ${normalizeFieldValue(e.getField("PAGES"))}`)};
            // if (e.getField("NOTE")) {suffix.push(`${normalizeFieldValue(e.getField("NOTE"))}`)};
            if (e.getField("ANNOTE")) {suffix.push(`${normalizeFieldValue(e.getField("ANNOTE"))}`)};
            if (e.getField("URL")) {suffix.push(`Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'techreport':
            // if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)};
            if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)};
            if (e.getField("NUMBER")) {body.push(`${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("INSTITUTION")) {body.push(`${normalizeFieldValue(e.getField("INSTITUTION"))}`)};
            if (e.getField("ADDRESS")) {body.push(`${normalizeFieldValue(e.getField("ADDRESS"))}:`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            // if (e.getField("TYPE")) {suffix.push(`[${normalizeFieldValue(e.getField("TYPE"))}]`)};
            if (e.getField("URL")) {suffix.push(`[Online]. Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'misc':
            if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)};
            if (e.getField("TITLE")) {body.push(`__${normalizeFieldValue(e.getField("TITLE"))}__`)};
            if (e.getField("HOWPUBLISHED")) {body.push(`${normalizeFieldValue(e.getField("HOWPUBLISHED"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            // if (e.getField("NOTE")) {suffix.push(`${normalizeFieldValue(e.getField("NOTE"))}`)};
            // if (e.getField("ANNOTE")) {suffix.push(`${normalizeFieldValue(e.getField("ANNOTE"))}`)};
            if (e.getField("URL")) {suffix.push(`[Online]. Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;
        case 'article':
            if (e.getField("AUTHOR")) {body.push(`${getAuthors(normalizeFieldValue((e.getField("AUTHOR"))))}`)};
            if (e.getField("TITLE")) {body.push(`"${normalizeFieldValue(e.getField("TITLE"))}"`)};
            if (e.getField("JOURNAL")) {body.push(`__${normalizeFieldValue(e.getField("JOURNAL"))}__`)};
            if (e.getField("VOLUME")) {body.push(`vol. ${normalizeFieldValue(e.getField("VOLUME"))}`)};
            if (e.getField("NUMBER")) {body.push(`no. ${normalizeFieldValue(e.getField("NUMBER"))}`)};
            if (e.getField("PAGES")) {suffix.push(`pp. ${normalizeFieldValue(e.getField("PAGES"))}`)};
            if (e.getField("MONTH") && e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("MONTH"))} ${normalizeFieldValue(e.getField("YEAR"))}`)}
            else if (e.getField("YEAR")) {body.push(`${normalizeFieldValue(e.getField("YEAR"))}`)};
            if (e.getField("URL")) {suffix.push(`[Online]. Available: ${normalizeFieldValue(e.getField("URL"))}`)};
            break;

    }
    if (suffix && suffix.length > 0) {
        body = body.join(", ").endsWith(".") ? `${entryIndex} ${body.join(", ")} ${suffix.join(", ")}.` : `${entryIndex} ${body.join(", ")}. ${suffix.join(", ")}.`
    } else {
        body = body.join(", ").endsWith(".") ? `${entryIndex} ${body.join(", ")}` : `${entryIndex} ${body.join(", ")}.`
    }
    if (e.getField("URL") && !e.getField("DOI")) {body = body.substring(0, body.length-1)}
    const index  = e.index
    return [index,body]
}

/**
 * Converts the AUTHORS field of a bibtex file to IEEE form.
 * @param {String} authors - All authors as string; if multiple authors are listed, they should be joined with "and" or ",".
 * @returns {String} - The formated string containing all authors in IEEE style.
 */
function getAuthors(authors) {
    if (authors.includes("et al")) {return authors}
    let authorsString = authors.includes(" and ") ? authors.split(" and "): authors.split(",")
    if (authorsString.length > 6) {
        return `${formatName(authorsString[0])} et al.`
    }
    for (let i in authorsString) {
        authorsString[i] = formatName(authorsString[i].trim())
    }
    return authorsString.join(" and ")
}

/**
 * Converts the EDITORS field of a bibtex file to IEEE form.
 * @param {*} editors - All editors as string; if multiple editors are listed, they should be joined with "and" or ",".
 * @returns {String} - The formated string containing all editors in IEEE style.
 */
function getEditors(editors) {
    if (editors.includes("Ed.")) {return editors}
    let editorsString = editors.split(",")
    if (editorsString.length === 1) {
        return `${formatName(editorsString[0])}, Ed.`
    }
    for (let i in editorsString) {
        editorsString[i] = formatName(editorsString[i])
    }
    return `${editorsString.join(" and ")}, Eds.`
}

/**
 * Converts an unformatted name into an IEEE formatted name.
 * @param {String} name - The unformatted name.
 * @returns {String} - The formatted name.
 */
function formatName(name) {
    let nameSplit = name.split(" ")
    for (let i = 0; i < nameSplit.length - 1; i++) {
        nameSplit[i] = nameSplit[i].charAt(0)+"."
    }
    return nameSplit.join(" ")
}

module.exports = {
    applyBibliography,
    getBibliographyFiles
}