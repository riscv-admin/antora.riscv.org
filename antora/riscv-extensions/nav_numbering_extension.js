// Antora extension to add chapter/appendix numbering to navigation files
// Save this as: riscv-extensions/nav-numbering-extension.js

const fs = require('fs')
const path = require('path')

module.exports.register = function ({ config }) {
  console.log('[Nav Numbering] Extension loaded!')
  
  // Configuration format:
  // numbering_rules:
  //   - module: priv
  //     chapters:
  //       start: 3
  //       end: 20
  //     appendices:
  //       start: 21
  //       end: 23
  const numberingRules = config?.numbering_rules || []
  
  console.log('[Nav Numbering] Rules:', JSON.stringify(numberingRules, null, 2))
  
  this.on('contentClassified', ({ contentCatalog }) => {
    console.log('[Nav Numbering] Processing navigation files')
    
    // Get all navigation files
    const navFiles = contentCatalog.getFiles().filter(file => 
      file.src && file.src.family === 'nav'
    )
    
    console.log(`[Nav Numbering] Found ${navFiles.length} navigation file(s)`)
    
    navFiles.forEach(navFile => {
      const moduleName = navFile.src.module
      
      // Find matching rule for this module
      const rule = numberingRules.find(r => r.module === moduleName)
      
      if (!rule) {
        console.log(`[Nav Numbering] No rules for module: ${moduleName}`)
        return
      }
      
      console.log(`[Nav Numbering] Processing nav for module: ${moduleName}`)
      
      const content = navFile.contents.toString()
      const lines = content.split('\n')
      
      let modified = false
      let chapterNum = 1
      let appendixNum = 1
      
      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1  // Convert to 1-indexed
        const line = lines[i]
        
        // Check if this line matches xref pattern
        const xrefMatch = line.match(/^(\* xref:[^\[]+\[)([^\]]+)(\].*)$/)
        
        if (!xrefMatch) continue
        
        const prefix = xrefMatch[1]
        const title = xrefMatch[2]
        const suffix = xrefMatch[3]
        
        // Check if we should add chapter numbering
        if (rule.chapters && 
            lineNum >= rule.chapters.start && 
            lineNum <= rule.chapters.end &&
            !title.startsWith('Chapter ')) {
          
          lines[i] = `${prefix}Chapter ${chapterNum}. ${title}${suffix}`
          console.log(`[Nav Numbering]   Line ${lineNum}: Added Chapter ${chapterNum}`)
          chapterNum++
          modified = true
        }
        // Check if we should add appendix numbering
        else if (rule.appendices && 
                 lineNum >= rule.appendices.start && 
                 lineNum <= rule.appendices.end &&
                 !title.startsWith('Appendix ')) {
          
          // Convert number to letter (1=A, 2=B, etc.)
          const appendixLetter = String.fromCharCode(64 + appendixNum)
          lines[i] = `${prefix}Appendix ${appendixLetter}. ${title}${suffix}`
          console.log(`[Nav Numbering]   Line ${lineNum}: Added Appendix ${appendixLetter}`)
          appendixNum++
          modified = true
        }
      }
      
      if (modified) {
        navFile.contents = Buffer.from(lines.join('\n'))
        console.log(`[Nav Numbering] Modified ${navFile.src.relative}`)
      }
    })
    
    console.log('[Nav Numbering] Processing complete')
  })
}