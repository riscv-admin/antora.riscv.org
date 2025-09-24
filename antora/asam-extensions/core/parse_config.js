'use strict'
//-------------
//-------------
// Core module for importing configuration from the site.yml.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

const defaultKeywordsFilename = "0_used-keywords.adoc"

/**
 * Parses the configuration from the project's site.yml and determines the corresponding variables from it.
 * @param {Object} config - The configuration from the site.yml.
 * @returns {Object} The determined configuration values numberedTitles, sectionNumberStyle, addToNavigation, unlistedPagesHeading, useKeywords, targetPath, targetModule, targetName, keywordOverviewPageRequested, localToGlobalReferences, workdir, loft, listUnusedPartials, alternateXrefStyle.
 */
function parse(config) {
    const { numberedTitles, sectionNumberStyle, addToNavigation, unlistedPagesHeading = 'Unlisted pages', localToGlobalReferences, workdir, loft, listUnusedPartials, alternateXrefStyle } = config
    const useKeywords = config.keywords ? true : false
    const asamBibliography = config.bibliography ? true : false
    let targetPath = useKeywords && config.keywords.path ? config.keywords.path : "",
        targetModule = useKeywords && config.keywords.module ? config.keywords.module : "ROOT",
        targetName = useKeywords && config.keywords.filename ? config.keywords.filename : defaultKeywordsFilename,
        keywordOverviewPageRequested = useKeywords && config.keywords.createOverview ? true : false

    return { numberedTitles, sectionNumberStyle, addToNavigation, unlistedPagesHeading, useKeywords, targetPath, targetModule, targetName, keywordOverviewPageRequested, localToGlobalReferences, workdir, loft, listUnusedPartials, alternateXrefStyle, asamBibliography }

}

module.exports = {
    parse
}