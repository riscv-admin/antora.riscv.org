// Antora extension to add chapter-based section numbering to page content
// Enhanced version - supports component name filtering and include::partial$ resolution

module.exports.register = function ({ config }) {
  const logger = this.getLogger('section-numbering-extension')

  logger.info('Section Numbering Extension loaded!')

  // Configuration format matches nav-numbering
  const numberingRules = config?.numberingRules || config?.numbering_rules || []

  if (numberingRules.length === 0) {
    logger.warn('No numbering rules configured!')
    return
  }

  logger.debug('Rules:', JSON.stringify(numberingRules, null, 2))

  this.on('contentClassified', ({ contentCatalog }) => {
    logger.info('Processing pages for section numbering')

    // Build a map of pages to their chapter numbers from nav files
    const pageToChapter = new Map()

    // First, process nav files to determine chapter numbers
    const navFiles = contentCatalog.getFiles().filter(file =>
      file.src && file.src.family === 'nav'
    )

    logger.info(`Found ${navFiles.length} navigation file(s) for mapping`)

    navFiles.forEach(navFile => {
      const componentName = navFile.src.component  // NEW: Get component name
      const moduleName = navFile.src.module
      const origin = navFile.src.origin
      const refname = origin?.refname
      const reftype = origin?.reftype || 'branch'

      // Find matching rule
      const rule = numberingRules.find(r => {
        if (r.module !== moduleName) return false

        // NEW: Check component match (if specified in rule)
        if (r.component && r.component !== componentName) return false

        if (!r.branches && !r.tags) return true
        if (r.branches && reftype === 'branch') {
          return r.branches.includes(refname)
        }
        if (r.tags && reftype === 'tag') {
          return r.tags.includes(refname)
        }
        return false
      })

      if (!rule || !rule.chapters) {
        logger.debug(`No chapter rules for component: ${componentName}, module: ${moduleName}`)
        return
      }

      logger.debug(`Building chapter map for component: ${componentName}, module: ${moduleName} (${reftype}: ${refname})`)

      const content = navFile.contents.toString()
      const lines = content.split('\n')
      let chapterNum = 1

      const chapterRanges = Array.isArray(rule.chapters) ? rule.chapters : [rule.chapters]

      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1
        const line = lines[i]

        // Match xref pattern
        const xrefMatch = line.match(/^\*+ xref:([^\[]+)\[/)
        if (!xrefMatch) continue

        // Check if this line is in any chapters range
        const inChapters = chapterRanges.some(r => lineNum >= r.start && lineNum <= r.end)
        if (inChapters) {
          const pageName = xrefMatch[1]
          // NEW: Include component in page key
          const pageKey = `${componentName}:${moduleName}:${refname}:${pageName}`
          pageToChapter.set(pageKey, chapterNum)
          logger.debug(`  Mapped ${componentName}:${pageName} to Chapter ${chapterNum}`)
          chapterNum++
        }
      }
    })

    logger.info(`Mapped ${pageToChapter.size} page(s) to chapter numbers`)

    // Build a map of partial files for include resolution
    // Key: "component:module:relative-path" (e.g. "debug:ROOT:abstract_commands.adoc")
    const partialFileMap = new Map()
    contentCatalog.getFiles()
      .filter(f => f.src && f.src.family === 'partial')
      .forEach(f => {
        const key = `${f.src.component}:${f.src.module}:${f.src.relative}`
        partialFileMap.set(key, f)
        logger.debug(`  Indexed partial: ${key}`)
      })

    logger.info(`Indexed ${partialFileMap.size} partial file(s)`)

    // Process a section header line and update counters/lines in place.
    // Returns true if the line was modified.
    function processSection(lines, i, sectionCounters, chapterNum) {
      const line = lines[i]
      const sectionMatch = line.match(/^(={2,6})\s+(.+?)(\s*\{#[^}]+\})?$/)
      if (!sectionMatch) return false

      const equals = sectionMatch[1]
      const level = equals.length - 1 // == is level 1, === is level 2, etc.
      let title = sectionMatch[2].trim()
      const anchor = sectionMatch[3] || ''

      // Skip if already numbered
      if (/^\d+\./.test(title)) {
        logger.debug(`  Skipping already numbered: ${title}`)
        return false
      }

      // Increment counter for this level
      sectionCounters[level - 1]++

      // Reset deeper level counters
      for (let j = level; j < sectionCounters.length; j++) {
        sectionCounters[j] = 0
      }

      // Build section number (e.g., "2.1.3")
      let sectionNumber = chapterNum.toString()
      for (let j = 0; j < level; j++) {
        if (sectionCounters[j] > 0) {
          sectionNumber += '.' + sectionCounters[j]
        }
      }

      // Add section number to title
      const numberedTitle = `${sectionNumber}. ${title}`
      lines[i] = `${equals} ${numberedTitle}${anchor}`

      logger.debug(`  ${equals} "${title}" -> "${numberedTitle}"`)
      return true
    }

    // Now process page files and add section numbering
    const pageFiles = contentCatalog.getFiles().filter(file =>
      file.src && file.src.family === 'page'
    )

    logger.info(`Processing ${pageFiles.length} pages for section numbering`)

    let processedCount = 0

    pageFiles.forEach(pageFile => {
      const componentName = pageFile.src.component  // NEW: Get component name
      const moduleName = pageFile.src.module
      const origin = pageFile.src.origin
      const refname = origin?.refname
      const pageName = pageFile.src.basename
      // NEW: Include component in page key
      const pageKey = `${componentName}:${moduleName}:${refname}:${pageName}`

      const chapterNum = pageToChapter.get(pageKey)

      if (!chapterNum) {
        // This page isn't a chapter, skip it
        logger.debug(`Skipping ${componentName}:${pageName} (not in chapter map)`)
        return
      }

      logger.info(`Processing ${componentName}:${pageName} as Chapter ${chapterNum}`)

      const content = pageFile.contents.toString()
      const pageLines = content.split('\n')
      let pageModified = false

      // Track section numbering across page and included partials
      const sectionCounters = [0, 0, 0, 0, 0] // Level 1-5

      // Track modifications to partials: partialKey -> { file, lines, modified }
      const partialEdits = new Map()

      for (let i = 0; i < pageLines.length; i++) {
        const line = pageLines[i]

        // Check for include::partial$ directive
        const includeMatch = line.match(/^include::partial\$([^\[]+)\[/)
        if (includeMatch) {
          const partialRelPath = includeMatch[1]
          const partialKey = `${componentName}:${moduleName}:${partialRelPath}`
          const partialFile = partialFileMap.get(partialKey)

          if (partialFile) {
            logger.debug(`  Resolving include: ${partialRelPath}`)

            // Reuse cached partial lines if we already edited this partial
            if (!partialEdits.has(partialKey)) {
              partialEdits.set(partialKey, {
                file: partialFile,
                lines: partialFile.contents.toString().split('\n'),
                modified: false,
              })
            }

            const edit = partialEdits.get(partialKey)

            for (let j = 0; j < edit.lines.length; j++) {
              if (processSection(edit.lines, j, sectionCounters, chapterNum)) {
                edit.modified = true
              }
            }
          } else {
            logger.debug(`  Partial not found in catalog: ${partialKey}`)
          }
          continue
        }

        // Process section header directly in page
        if (processSection(pageLines, i, sectionCounters, chapterNum)) {
          pageModified = true
        }
      }

      // Write back modified page
      if (pageModified) {
        pageFile.contents = Buffer.from(pageLines.join('\n'))
        logger.info(`Modified page ${pageFile.src.relative}`)
        processedCount++
      }

      // Write back modified partials
      for (const [key, edit] of partialEdits) {
        if (edit.modified) {
          edit.file.contents = Buffer.from(edit.lines.join('\n'))
          logger.info(`Modified partial ${key}`)
        }
      }
    })

    logger.info(`Section numbering complete (${processedCount} page(s) numbered)`)
  })
}
