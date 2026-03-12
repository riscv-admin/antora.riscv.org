// Antora extension to add chapter/appendix numbering to navigation files
// Enhanced version - supports component name filtering

const fs = require('fs')
const path = require('path')

module.exports.register = function ({ config }) {
  const logger = this.getLogger('nav-numbering-extension')
  
  logger.info('Nav Numbering Extension loaded!')
  
  // Configuration can come in as either numbering_rules or numberingRules
  const numberingRules = config?.numberingRules || config?.numbering_rules || []
  
  if (numberingRules.length === 0) {
    logger.warn('No numbering rules configured!')
    return
  }
  
  logger.debug('Parsed rules:', JSON.stringify(numberingRules, null, 2))
  
  // Use contentClassified to modify raw nav files (like original)
  this.on('contentClassified', ({ contentCatalog }) => {
    logger.info('Processing navigation files')
    
    // Get all navigation files
    const navFiles = contentCatalog.getFiles().filter(file => 
      file.src && file.src.family === 'nav'
    )
    
    logger.info(`Found ${navFiles.length} navigation file(s)`)
    
    let processedCount = 0
    let modulesWithoutRules = new Set()
    
    navFiles.forEach(navFile => {
      const componentName = navFile.src.component  // NEW: Get component name
      const moduleName = navFile.src.module
      const version = navFile.src.version
      const origin = navFile.src.origin
      const refname = origin?.refname
      const reftype = origin?.reftype || 'branch'
      
      logger.debug(`Checking nav: component=${componentName}, module=${moduleName}, version=${version}, ${reftype}=${refname}`)
      
      // Find matching rule for this module
      const rule = numberingRules.find(r => {
        // Check module match
        if (r.module !== moduleName) return false
        
        // NEW: Check component match (if specified in rule)
        if (r.component && r.component !== componentName) return false
        
        // If no branch/tag filters specified, match any
        if (!r.branches && !r.tags) return true
        
        // Check branch match
        if (r.branches && reftype === 'branch') {
          return r.branches.includes(refname)
        }
        
        // Check tag match
        if (r.tags && reftype === 'tag') {
          return r.tags.includes(refname)
        }
        
        return false
      })
      
      if (!rule) {
        modulesWithoutRules.add(`${componentName}:${moduleName}`)
        return
      }
      
      logger.info(`Processing nav for component: ${componentName}, module: ${moduleName} (${reftype}: ${refname})`)
      
      const content = navFile.contents.toString()
      const lines = content.split('\n')
      
      let modified = false
      let chapterNum = 1
      let appendixNum = 1
      
      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1  // Convert to 1-indexed
        const line = lines[i]
        
        // Check if this line matches xref pattern
        const xrefMatch = line.match(/^(\*+ xref:[^\[]+\[)([^\]]+)(\].*)$/)
        
        if (!xrefMatch) continue
        
        const prefix = xrefMatch[1]
        const title = xrefMatch[2]
        const suffix = xrefMatch[3]
        
        // Skip if already numbered
        if (title.startsWith('Chapter ') || title.startsWith('Appendix ')) {
          continue
        }
        
        // Check if we should add chapter numbering
        if (rule.chapters && 
            lineNum >= rule.chapters.start && 
            lineNum <= rule.chapters.end) {
          
          lines[i] = `${prefix}Chapter ${chapterNum}. ${title}${suffix}`
          logger.debug(`  Line ${lineNum}: Added Chapter ${chapterNum} - ${title}`)
          chapterNum++
          modified = true
        }
        // Check if we should add appendix numbering
        else if (rule.appendices && 
                 lineNum >= rule.appendices.start && 
                 lineNum <= rule.appendices.end) {
          
          // Convert number to letter (1=A, 2=B, etc.)
          const appendixLetter = String.fromCharCode(64 + appendixNum)
          lines[i] = `${prefix}Appendix ${appendixLetter}. ${title}${suffix}`
          logger.debug(`  Line ${lineNum}: Added Appendix ${appendixLetter} - ${title}`)
          appendixNum++
          modified = true
        }
      }
      
      if (modified) {
        navFile.contents = Buffer.from(lines.join('\n'))
        logger.info(`Modified ${navFile.src.relative}`)
        processedCount++
      }
    })
    
    // Log summary
    if (modulesWithoutRules.size > 0) {
      modulesWithoutRules.forEach(componentModule => {
        logger.info(`No rules for: ${componentModule}`)
      })
    }
    
    logger.info(`Processing complete (${processedCount} navigation file(s) processed)`)
  })
}
