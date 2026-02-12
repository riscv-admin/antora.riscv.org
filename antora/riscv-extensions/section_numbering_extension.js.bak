// Antora extension to add chapter-based section numbering to page content
// Save this as: riscv-extensions/section-numbering-extension.js

module.exports.register = function ({ config }) {
  console.log('[Section Numbering] Extension loaded!')
  
  // Configuration format matches nav-numbering
  const numberingRules = config?.numberingRules || config?.numbering_rules || []
  
  console.log('[Section Numbering] Rules:', JSON.stringify(numberingRules, null, 2))
  
  this.on('contentClassified', ({ contentCatalog }) => {
    console.log('[Section Numbering] Processing pages')
    
    // Build a map of pages to their chapter numbers from nav files
    const pageToChapter = new Map()
    
    // First, process nav files to determine chapter numbers
    const navFiles = contentCatalog.getFiles().filter(file => 
      file.src && file.src.family === 'nav'
    )
    
    navFiles.forEach(navFile => {
      const moduleName = navFile.src.module
      const origin = navFile.src.origin
      
      // Find matching rule
      const rule = numberingRules.find(r => {
        if (r.module !== moduleName) return false
        if (!r.branches && !r.tags) return true
        if (r.branches && origin?.reftype === 'branch') {
          return r.branches.includes(origin.refname)
        }
        if (r.tags && origin?.reftype === 'tag') {
          return r.tags.includes(origin.refname)
        }
        return false
      })
      
      if (!rule || !rule.chapters) return
      
      const content = navFile.contents.toString()
      const lines = content.split('\n')
      let chapterNum = 1
      
      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1
        const line = lines[i]
        
        // Match xref pattern
        const xrefMatch = line.match(/^\* xref:([^\[]+)\[/)
        if (!xrefMatch) continue
        
        // Check if this line is in the chapters range
        if (lineNum >= rule.chapters.start && lineNum <= rule.chapters.end) {
          const pageName = xrefMatch[1]
          const pageKey = `${moduleName}:${origin?.refname}:${pageName}`
          pageToChapter.set(pageKey, chapterNum)
          console.log(`[Section Numbering] Mapped ${pageName} to Chapter ${chapterNum}`)
          chapterNum++
        }
      }
    })
    
    // Now process page files and add section numbering
    const pageFiles = contentCatalog.getFiles().filter(file =>
      file.src && file.src.family === 'page'
    )
    
    console.log(`[Section Numbering] Processing ${pageFiles.length} pages`)
    
    pageFiles.forEach(pageFile => {
      const moduleName = pageFile.src.module
      const origin = pageFile.src.origin
      const pageName = pageFile.src.basename
      const pageKey = `${moduleName}:${origin?.refname}:${pageName}`
      
      const chapterNum = pageToChapter.get(pageKey)
      
      if (!chapterNum) {
        // This page isn't a chapter, skip it
        return
      }
      
      console.log(`[Section Numbering] Processing ${pageName} as Chapter ${chapterNum}`)
      
      const content = pageFile.contents.toString()
      const lines = content.split('\n')
      let modified = false
      
      // Track section numbering
      const sectionCounters = [0, 0, 0, 0, 0] // Level 1-5
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Match section headers (=, ==, ===, etc.)
        const sectionMatch = line.match(/^(={2,6})\s+(.+?)(\s*\{#[^}]+\})?$/)
        
        if (sectionMatch) {
          const level = sectionMatch[1].length - 1 // == is level 1, === is level 2, etc.
          const title = sectionMatch[2].trim()
          const anchor = sectionMatch[3] || ''
          
          // Skip if already numbered
          if (/^\d+\./.test(title)) {
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
          lines[i] = `${sectionMatch[1]} ${numberedTitle}${anchor}`
          
          console.log(`[Section Numbering]   ${sectionMatch[1]} ${title} -> ${numberedTitle}`)
          modified = true
        }
      }
      
      if (modified) {
        pageFile.contents = Buffer.from(lines.join('\n'))
        console.log(`[Section Numbering] Modified ${pageFile.src.relative}`)
      }
    })
    
    console.log('[Section Numbering] Processing complete')
  })
}