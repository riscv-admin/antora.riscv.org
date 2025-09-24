'use strict'
//-------------
//-------------
// Module for generating a list of all pages not contained in any navigation file and, optionally, adding them under a new entry.
// This module provides a central function, 'find_orphan_pages'.
//
//-------------
//-------------
// Author: Dan Allen
// Source: https://gitlab.com/antora/antora/-/blob/main/docs/modules/extend/examples/unlisted-pages-extension.js
//-------------
//-------------
const ContentAnalyzer = require('../../core/content_analyzer.js')

/**
 * Find and list all pages not included in any navigation file. If addToNavigation is set, also add them as a new entry to the navigation tree.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {Boolean} addToNavigation - States if the found pages are to be collectively added under a new entry in the navigation tree.
 * @param {String} unlistedPagesHeading - If addToNavigation is true, this is the name under which the orphan pages are to be collected under.
 * @param {*} logger - A logger for logging output.
 */
function find_orphan_pages( contentCatalog, addToNavigation, unlistedPagesHeading, logger ) {
contentCatalog.getComponents().forEach(({ versions }) => {
    listAllOrphanPages(contentCatalog, versions, addToNavigation, unlistedPagesHeading, logger)
    listAllNonHostedPages(contentCatalog, versions, logger)
  })
}

/**
 * Lists all pages that are orphans (i.e. not listed in any navigation file).
 * Optionally adds them under a new bullet point to the navigation list.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {Array <Object>} versions - Array of versions extracted from the contentCatalog.
 * @param {Boolean} addToNavigation - States whether the found orphan files shall also be added to the navigation under a new heading.
 * @param {String} unlistedPagesHeading - The heading for all orphan pages if they are to be listed.
 * @param {*} logger - A logger for logging output.
 */
function listAllOrphanPages (contentCatalog, versions, addToNavigation, unlistedPagesHeading, logger) {
    versions.forEach(({ name: component, version, navigation: nav, url: defaultUrl }) => {
        const navEntriesByUrl = ContentAnalyzer.getNavEntriesByUrl(nav)
        const unlistedPages = contentCatalog
          .findBy({ component, version, family: 'page' })
          .filter((page) => page.out && page.src &&  page.src.stem !== "_config")
          .reduce((collector, page) => {
            if ((page.pub.url in navEntriesByUrl) || page.pub.url === defaultUrl) return collector
            //-------------
            // Create logger entry for any page that was has been found but is not entered in at least one navigation file
            //-------------
            logger.warn({ file: page.src, source: page.src.origin }, 'detected unlisted page')
            return collector.concat(page)
          }, [])
        //-------------
        // Optional: Add found unlisted files to a new navigation entry
        // Optional settings: add_to_navigation: true; unlisted_pages_heading: "Unlisted pages"
        //-------------
        if (unlistedPages.length && addToNavigation) {
          nav.push({
            content: unlistedPagesHeading,
            items: unlistedPages.map((page) => {
              return { content: page.asciidoc.navtitle, url: page.pub.url, urlType: 'internal' }
            }),
            root: true,
          })
        }
    })
}

/**
 * Lists all pages that are not converted and then hosted.
 * @param {Object} contentCatalog - The content catalog provided by Antora.
 * @param {Array <Object>} versions - Array of version extracted from the contentCatalog.
 * @param {*} logger - A logger for logging output.
 */
function listAllNonHostedPages(contentCatalog, versions, logger) {
    versions.forEach(({ name: component, version }) => {
        const unlistedPages = contentCatalog
          .findBy({ component, version, family: 'page' })
          .reduce((collector, page) => {if (page.out || (page.src && page.src.stem === "_config")) return collector
            //-------------
            // Create logger entry for any page that was has been found but is not entered in at least one navigation file
            //-------------
            logger.warn({ file: page.src, source: page.src.origin }, 'detected not converted page')
            return collector.concat(page)
          }, [])
        //-------------
        // Optional: Add found unlisted files to a new navigation entry
        // Optional settings: add_to_navigation: true; unlisted_pages_heading: "Unlisted pages"
        //-------------
    })
}

module.exports = {
    find_orphan_pages
}