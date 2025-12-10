// Antora extension to rewrite include directives to use resource coordinates
// Save this as: riscv-extensions/include-rewriter.js

module.exports.register = function ({ config }) {
  console.log('[Include Rewriter] Extension loaded!')
  
  // Configuration: specify which sources to process
  const targetSources = config?.target_sources || [
    {
      url: 'https://github.com/riscv/riscv-isa-manual.git',
      // branches: ['main', 'develop'],  // Optional: only these branches
      // tags: ['v1.0', 'v2.0']          // Optional: only these tags
    }
  ]
  
  console.log('[Include Rewriter] Target sources configuration:', JSON.stringify(targetSources, null, 2))
  
  this.on('contentClassified', ({ contentCatalog }) => {
    console.log('[Include Rewriter] contentClassified event triggered')
    
    // Process all page files
    const files = contentCatalog.getFiles()
    console.log(`[Include Rewriter] Processing ${files.length} total files`)
    
    files.forEach((file) => {
      // Only process AsciiDoc files in the pages family
      if (!file.src || file.src.mediaType !== 'text/asciidoc') return
      if (file.src.family !== 'page') return
      
      // Check if this file's source should be processed
      const origin = file.src.origin
      if (!origin) return
      
      const shouldProcess = targetSources.some(target => {
        // Handle both string format and object format
        if (typeof target === 'string') {
          return origin.url && origin.url.includes(target)
        }
        
        // Object format with url, branches, tags
        const urlMatch = target.url && origin.url && origin.url.includes(target.url)
        if (!urlMatch) return false
        
        // If branches specified, check if refname matches
        if (target.branches && target.branches.length > 0) {
          if (origin.reftype !== 'branch' || !target.branches.includes(origin.refname)) {
            return false
          }
        }
        
        // If tags specified, check if refname matches
        if (target.tags && target.tags.length > 0) {
          if (origin.reftype !== 'tag' || !target.tags.includes(origin.refname)) {
            return false
          }
        }
        
        return true
      })
      
      if (!shouldProcess) {
        return
      }
      
      console.log(`[Include Rewriter] Processing page: ${file.src.relative}`)
      
      const contents = file.contents.toString()
      const module = file.src.module || 'ROOT'
      
      // Map directories to families
      const familyMap = {
        'images': 'partial',
        'example': 'example',
        'examples': 'example',
        'partials': 'partial',
        'pages': 'page'
      }
      
      // Process line by line to avoid String.replace() issues
      const lines = contents.split('\n')
      let modified = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check if line contains an include directive
        const includeMatch = line.match(/^include::([^:\[\]]+)(\[[^\]]*\])/)
        
        if (includeMatch) {
          const target = includeMatch[1]
          const brackets = includeMatch[2]
          
          console.log(`[Include Rewriter] Line ${i}: Found include::${target}${brackets}`)
          
          // Skip if already a coordinate
          if (target.includes(':') || target.startsWith('{')) {
            console.log(`[Include Rewriter] Skipping (already coordinate)`)
            continue
          }
          
          // Skip if no directory structure
          if (!target.includes('/')) {
            console.log(`[Include Rewriter] Skipping (no directory)`)
            continue
          }
          
          // Parse the target path
          const slashIndex = target.indexOf('/')
          const firstDir = target.substring(0, slashIndex)
          const restOfPath = target.substring(slashIndex + 1)
          
          console.log(`[Include Rewriter]   firstDir: "${firstDir}"`)
          console.log(`[Include Rewriter]   restOfPath: "${restOfPath}"`)
          
          // Map the first directory to a family
          const family = familyMap[firstDir] || 'partials'
          
          console.log(`[Include Rewriter]   family: "${family}"`)
          console.log(`[Include Rewriter]   module: "${module}"`)
          
          // Build the new line
          const newLine = 'include::' + module + ':' + family + '$' + restOfPath + brackets
          
          console.log(`[Include Rewriter]   New line: ${newLine}`)
          
          lines[i] = newLine
          modified = true
        }
      }
      
      // Update the file contents if modified
      if (modified) {
        const newContents = lines.join('\n')
        file.contents = Buffer.from(newContents)
        console.log(`[Include Rewriter] Modified ${file.src.relative}`)
      }
    })
    
    console.log('[Include Rewriter] Processing complete')
  })
}