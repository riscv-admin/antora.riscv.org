'use strict'
//-------------
//-------------
// This is the ASAM Antora extension.
// It is the central file bundling all other Antora extensions in one single extension.
// This file handles configurations and accesses the requested addons accordingly.
// Important: Some extensions may have cross-dependencies and impact the result of each other.
// In those instances, this file is responsible for handling priorities and order as well as number of executions correctly.
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
// Include the addons (i.e. the sub-extensions).
// 1) Core includes
//-------------
const CON = require('./core/constants.js');
const ConfigParser = require("./core/parse_config.js");
const ContentAnalyzer = require('./core/content_analyzer.js')
//-------------
// 2) Addons
//-------------
const Macros = require('./antora/asam_macros/asam_macros.js')
const AsciiNav = require('./antora/nav_from_index/nav_from_index.js')
const ConsistentNumbering = require('./antora/consistent_numbering/numbered_titles.js');
const CrossrefReplacement = require('./antora/crossref_replacement/crossref_replacement.js')
const Doxygen = require("./antora/doxygen_converter/doxygen_extension.js")
const EA = require("./antora/ea_converter/ea_extension.js")
const Keywords = require('./antora/keywords_overview/keywords_overview.js');
const Orphans = require('./antora/orphan_pages/orphan_pages.js');
const LostAndFound = require('./antora/orphan_pages/orphan_files.js')
const Loft = require("./antora/loft/loft.js");
const RefStyle = require("./antora/reference_style_mixing/reference_style_mixing.js")
const Bibliography = require("./antora/bibliography/bibliography.js")
//const Bibliography = require("./antora/bibliography/bibliography_csl.js")
const AttachmentsGenerator = require("./antora/attachments_generator/attachments_generator.js")
//-------------
//-------------
// Register this module in antora so it is used by the Antora pipeline.
// It receives the configuration set in the site.yml or the CLI.
// According to the configuration, certain addons and/or features are used and variables set.
//-------------
module.exports.register = function ({ config }) {
    const logger = this.require('@antora/logger').get('unlisted-pages-extension')
    // Parse the config file and return the values as the parsedConfig object
    let parsedConfig = ConfigParser.parse(config)
    let bibliographyFiles = []

    this
      .on('contentAggregated', ({contentAggregate}) => {
          if (config.enterpriseArchitect) {
              EA.convertEnterpriseArchitect(parsedConfig.workdir,contentAggregate)
          }
          if (config.doxygen) {
              Doxygen.convertDoxygen(parsedConfig.workdir,contentAggregate)
          }
          if (parsedConfig.asamBibliography) {
            bibliographyFiles = Bibliography.getBibliographyFiles(contentAggregate)
          }
          AttachmentsGenerator.generateAttachments(contentAggregate)
      })

      //-------------
      // Execute features on the "contentClassified" step of the pipeline.
      // At this point, the content has been loaded and analyzed / classified but has not yet been converted.
      //-------------
      .on('contentClassified', ({ contentCatalog }) => {
        console.log("Reacting on contentClassified")

        //-------------
        // Execute all features for each component-version-combination
        //-------------
        contentCatalog.getComponents().forEach(({ versions }) => {
            versions.forEach(({ name: component, version, url: defaultUrl }) => {
                console.log("#".repeat(50))
                console.log(`Processing ${component} (${version})`)
                console.log("#".repeat(50))
                //-------------
                // For each component-version-combo, get all pages and all nav files.
                //-------------
                let pages = contentCatalog.findBy({ component, version, family: 'page'})
                let navFiles = contentCatalog.findBy({ component, version, family: 'nav'}).sort((a,b) => {
                    return a.nav.index - b.nav.index
                })
                //-------------
                // Addon AsciiNav: Parse files and create navigation if attribute "antora_mapping" is used.
                //-------------
                console.log("Check if Asciidoctor mapping page needs to be converted to Antora navigation file...\n"+"-".repeat(50))
                AsciiNav.createAntoraNavigationFromIndex(pages, navFiles)
                navFiles = contentCatalog.findBy({ component, version, family: 'nav'})
                let catalog =  contentCatalog.findBy({ component, version})
                const componentAttributes = contentCatalog.getComponents().filter(x => x.name === component)[0].versions.filter(x => x.version === version)[0].asciidoc.attributes
                console.log("-".repeat(50)+"\n")
                //-------------
                // Analyze the pages and create maps for the addons.
                //-------------
                let mapInput = {
                    contentCatalog: contentCatalog.findBy({ family: 'page' }).concat(contentCatalog.findBy({ family: 'partial' })),
                    catalog: catalog,
                    useKeywords: parsedConfig.useKeywords,
                    pages: pages,
                    navFiles: navFiles,
                    componentAttributes: componentAttributes,
                    fullContentCatalog: contentCatalog,
                    component: component,
                    version: version
                }
                //-------------
                // Addon Bibliography: Works similar to the original Asciidoctor bibtex extension, but for Antora.
                // Required setting: keywords: bibliography: true (site.yml); asamBibliography: 'path/to/file.bib' (antora.yml)
                // NOTE: This applies the 'iso690-numeric-brackets-cs' as default even if the default of the function itself is 'ieee'.
                //-------------
                if (parsedConfig.asamBibliography) {
                    console.log("Creating bibliography and reference links...\n"+"-".repeat(50))
                    const style = config.bibtexStyle ? config.bibtexStyle : componentAttributes['bibtex-style'] ? componentAttributes['bibtex-style'] : "iso690-numeric-brackets-cs"
                    const language = config.bibtexLocale ? config.bibtexLocale : componentAttributes['bibtex-locale'] ? componentAttributes['bibtex-locale'] : "en"
                    Bibliography.applyBibliography(mapInput, bibliographyFiles, style, language)
                    console.log("-".repeat(50)+"\n")
                }
                console.log("Generating content overview maps...\n"+"-".repeat(50))
                let { keywordPageMap, rolePageMap, anchorPageMap } = ContentAnalyzer.generateMapsForPages( mapInput )
                console.log("-".repeat(50)+"\n")
                //-------------
                // Addon Keywords: Create initial keywords overview page.
                // Required setting: keywords: create_overview: true
                // Optional settings: keywords: path: ""; keywords: module: "ROOT"; keywords: filename: "0_used-keywords.adoc"
                //-------------
                if (parsedConfig.keywordOverviewPageRequested){
                    console.log("Creating a keyword overview page...\n"+"-".repeat(50))
                    pages = Keywords.createKeywordsOverviewPage(parsedConfig.keywordOverviewPageRequested, contentCatalog, pages, keywordPageMap, parsedConfig.targetPath, parsedConfig.targetName, parsedConfig.targetModule, component, version)
                    keywordPageMap = ContentAnalyzer.getKeywordPageMapForPages(parsedConfig.useKeywords,pages)
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Addon Macros: Replace all custom macros. NOTE: This REQUIRES the keywords extension!
                //-------------
                console.log("Replacing custom macros...\n"+"-".repeat(50))
                pages = Macros.findAndReplaceCustomASAMMacros( contentCatalog, pages, navFiles, keywordPageMap, rolePageMap, CON.macrosRegEx, CON.macrosHeadings, logger, component, version )
                keywordPageMap = ContentAnalyzer.getKeywordPageMapForPages(parsedConfig.useKeywords,pages)
                console.log("-".repeat(50)+"\n")
                //-------------
                // Addon Keywords: Create final keywords overview page.
                //-------------
                if (parsedConfig.keywordOverviewPageRequested){
                    console.log("Updating the keyword overview page again...\n"+"-".repeat(50))
                    pages = Keywords.createKeywordsOverviewPage(parsedConfig.keywordOverviewPageRequested, contentCatalog, pages, keywordPageMap, parsedConfig.targetPath, parsedConfig.targetName, parsedConfig.targetModule, component, version)
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Get updated nav files. This is important because one of the macros may have added an additional navigation file or changed an existing one.
                //-------------
                navFiles = contentCatalog.findBy({ component, version, family: 'nav'})
                //-------------
                // Addon Loft: Creates a List Of Figures and Tables
                //-------------
                if (parsedConfig.loft) {
                    console.log("Creating list of figures and tables...\n"+"-".repeat(50))
                    catalog =  contentCatalog.findBy({ component, version})
                    Loft.createLoft(componentAttributes, contentCatalog, anchorPageMap, navFiles, catalog, component, version)
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Addon ConsistentNumbering: Generate and apply consistent numbers for sections, titles, and (if activated) figures and tables
                // Required setting: numbered_titles: true
                // Optional setting: section_number_style: "iso"
                //-------------
                if (parsedConfig.numberedTitles) {
                    console.log("Create sequential section numbers, titles, and captions...\n"+"-".repeat(50))
                    catalog =  contentCatalog.findBy({ component, version})
                    ConsistentNumbering.applySectionAndTitleNumbers(mapInput, mapInput.contentCatalog, pages, navFiles, parsedConfig.sectionNumberStyle, contentCatalog, component, version)
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Addon CrossrefReplacement: Replace Asciidoctor local references ("<<ref>>") where the anchor is now located on a different page.
                // Note that only in case at least one valid anchor could be found and added to the map, the addon actually runs.
                // Required setting: local_to_global_references: true
                //-------------
                if (anchorPageMap.size > 0 && parsedConfig.localToGlobalReferences) {
                    console.log("Replace local references to global anchors with xref macro...\n"+"-".repeat(50))
                    pages = CrossrefReplacement.findAndReplaceLocalReferencesToGlobalAnchors( componentAttributes, anchorPageMap, pages, parsedConfig.alternateXrefStyle )
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Addon CrossrefReplacement: Replace Asciidoctor local references ("<<ref>>") where the anchor is now located on a different page.
                // Note that only in case at least one valid anchor could be found and added to the map, the addon actually runs.
                // Required setting: local_to_global_references: true
                //-------------
                if (parsedConfig.alternateXrefStyle && parsedConfig.alternateXrefStyle !== "") {
                    console.log(`Applying explicit xref style ${parsedConfig.alternateXrefStyle} for xrefs...`)
                    catalog =  contentCatalog.findBy({ component, version})
                    mapInput.componentAttributes = componentAttributes
                    RefStyle.addXrefStyleToSectionAndPageXrefs(mapInput, catalog, mapInput.componentAttributes, anchorPageMap, parsedConfig.alternateXrefStyle)
                    console.log("-".repeat(50)+"\n")
                }
                //-------------
                // Addon LostAndFound: Lists content that is not used.
                // Note that this currently focusses on Asciidoc files only.
                // Since some features may require adoc content in non-adoc files, this is not conclusive whether a partial is actually used or not!
                //-------------
                if (parsedConfig.listUnusedPartials){
                    console.log("List unused partials and draft pages...\n"+"-".repeat(50))
                    LostAndFound.listAllUnusedPartialsAndDraftPages(contentCatalog, component, version, logger)
                    console.log("-".repeat(50)+"\n")
                }
            })
        })
      })
      //-------------
      //-------------
      // Execute features on the "navigationBuilt" step of the pipeline.
      // At this point, the content has been loaded and analyzed / classified but has not yet been converted. However, its navigation has been structured by analyzing the provided navigation files (nav.adoc).
      //-------------
      .on('navigationBuilt', ({ contentCatalog }) => {
        console.log("Reacting on navigationBuild")
        //-------------
        // Execute all features for each component-version-combination
        //-------------
        console.log("List orphan pages...\n"+"-".repeat(50))
        Orphans.find_orphan_pages(contentCatalog,parsedConfig.addToNavigation, parsedConfig.unlistedPagesHeading, logger)
        console.log("-".repeat(50)+"\n")
      })
  }
