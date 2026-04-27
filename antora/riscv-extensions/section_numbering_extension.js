// Antora extension to add chapter-based section numbering to page content
// Enhanced version - supports component name filtering

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
      const lines = content.split('\n')
      let modified = false

      // Track section numbering
      const sectionCounters = [0, 0, 0, 0, 0] // Level 1-5

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Match section headers (=, ==, ===, etc.)
        const sectionMatch = line.match(/^(={2,6})\s+(.+?)(\s*\{#[^}]+\})?$/)

        if (!sectionMatch) continue

        const equals = sectionMatch[1]
        const level = equals.length - 1 // == is level 1, === is level 2, etc.
        let title = sectionMatch[2].trim()
        const anchor = sectionMatch[3] || ''

        // Skip if already numbered
        if (/^\d+\./.test(title)) {
          logger.debug(`  Skipping already numbered: ${title}`)
          continue
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
        modified = true
      }

      if (modified) {
        pageFile.contents = Buffer.from(lines.join('\n'))
        logger.info(`Modified ${pageFile.src.relative}`)
        processedCount++
      }
    })

    logger.info(`Section numbering complete (${processedCount} page(s) numbered)`)
  })
}
