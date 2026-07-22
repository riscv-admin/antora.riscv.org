// Antora extension to copy files from outside source into content catalog
// Save this as: riscv-extensions/copy-files-extension.js

const fs = require('fs')
const http = require('http')
const https = require('https')
const path = require('path')

module.exports.register = function ({ config, playbook }) {
  console.log('[File Copy] Extension loaded!')
  
  // Configuration: specify which sources to process
  // Can filter by URL, branches, and tags
  const targetSources = config?.target_sources || [
    {
      url: 'https://github.com/riscv/riscv-isa-manual.git',
      // branches: ['main', 'develop'],  // Optional: only these branches
      // tags: ['v1.0', 'v2.0']          // Optional: only these tags
    }
  ]
  
  // Configuration: specify which source directories to copy from
  // Default is src/images, but can add src/ or any other directories
  const sourceDirs = config?.source_dirs || [
    { source: 'src/images', target: 'partials' },
    { source: 'src', target: 'partials', extensions: ['.adoc'] }  // Only copy .adoc files from src/
  ]

  // Optional build-output copy rules for legacy artifacts (such as PDFs) that
  // are not part of current Antora content sources.
  //
  // Example:
  // legacy_files:
  //   - versions: [v20250508, v20240411]
  //     source_url: 'https://docs.riscv.org/reference/isa/{version}/_attachments/riscv-unprivileged.pdf'
  //     target_path: 'isa/{version}/_attachments/riscv-unprivileged.pdf'
  const legacyFiles = config?.legacy_files || []
  // Local PDF archive mirror settings.
  // Mirrors antora/pdfs into the site output so PDF-only legacy versions are
  // published even when their docs are not rebuilt by Antora.
  //const pdfMirrorEnabled = config?.pdf_mirror !== false
  //const pdfsSourceDir = config?.pdfs_source_dir || './pdfs'
  const pdfMirrorEnabled = false  // Disabled for debugging
  const pdfsSourceDir = config?.pdfs_source_dir || './pdfs'
  
  console.log('[File Copy] Target sources configuration:', JSON.stringify(targetSources, null, 2))
  console.log('[File Copy] Source directories:', JSON.stringify(sourceDirs, null, 2))
  console.log(`[File Copy] PDF mirror: ${pdfMirrorEnabled ? 'enabled' : 'disabled'} (${pdfsSourceDir})`)
  if (legacyFiles.length) {
    console.log('[File Copy] Legacy file copy rules:', JSON.stringify(legacyFiles, null, 2))
  }
  
  this.on('contentClassified', ({ contentCatalog }) => {
    console.log('[File Copy] contentClassified event triggered')
    
    // Get all files to find worktrees
    const allFiles = contentCatalog.getFiles()
    console.log(`[File Copy] Total files in catalog: ${allFiles.length}`)
    
    if (allFiles.length === 0) {
      console.log('[File Copy] No files in catalog yet')
      return
    }
    
    // Get unique worktrees from the files
    const worktrees = new Set()
    const worktreeToOrigin = new Map()
    
    allFiles.forEach(file => {
      if (file.src && file.src.origin && file.src.origin.worktree) {
        const worktree = file.src.origin.worktree
        
        worktrees.add(worktree)
        if (!worktreeToOrigin.has(worktree)) {
          worktreeToOrigin.set(worktree, {
            url: file.src.origin.url,
            refname: file.src.origin.refname,  // branch or tag name
            reftype: file.src.origin.reftype   // 'branch' or 'tag'
          })
        }
      }
    })
    
    console.log(`[File Copy] Found ${worktrees.size} worktree(s)`)
    
    worktrees.forEach((worktree) => {
      const origin = worktreeToOrigin.get(worktree)
      
      // Check if this source should be processed
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
        console.log(`[File Copy] Skipping: ${origin.url} (${origin.reftype}: ${origin.refname}) - not in target list`)
        return
      }
      
      console.log(`[File Copy] Processing: ${origin.url} (${origin.reftype}: ${origin.refname})`)
      console.log(`[File Copy] Processing worktree: ${worktree}`)
      
      // Process each configured source directory
      sourceDirs.forEach((dirConfig) => {
        const sourceDir = path.join(worktree, dirConfig.source)
        const targetFamily = dirConfig.target || 'partials'
        const allowedExtensions = dirConfig.extensions  // Optional file extension filter
        
        // Check if source directory exists
        if (!fs.existsSync(sourceDir)) {
          console.log(`[File Copy] Source directory not found: ${sourceDir}`)
          return
        }
        
        console.log(`[File Copy] Found source directory: ${sourceDir}`)
        console.log(`[File Copy] Target family: ${targetFamily}`)
        if (allowedExtensions) {
          console.log(`[File Copy] File extensions filter: ${allowedExtensions.join(', ')}`)
        }
        
        // Helper function to check if file should be copied based on extension
        function shouldCopyFile(filename) {
          if (!allowedExtensions || allowedExtensions.length === 0) return true
          const ext = path.extname(filename)
          return allowedExtensions.includes(ext)
        }
        
        // First, process files directly in the source directory (root level)
        const rootItems = fs.readdirSync(sourceDir)
        rootItems.forEach((item) => {
          const itemPath = path.join(sourceDir, item)
          const stats = fs.statSync(itemPath)
          
          if (!stats.isDirectory() && shouldCopyFile(item)) {
            // This is a root-level file
            console.log(`[File Copy] Processing root-level file: ${item}`)
            
            const content = fs.readFileSync(itemPath)
            
            // Find modules directory
            let componentsDir = path.join(worktree, 'docs', 'modules')
            
            if (!fs.existsSync(componentsDir)) {
              componentsDir = path.join(worktree, 'modules')
              if (!fs.existsSync(componentsDir)) {
                console.log(`[File Copy] No modules directory found in worktree`)
                return
              }
            }
            
            const modules = fs.readdirSync(componentsDir)
            
            modules.forEach((moduleName) => {
              const moduleDir = path.join(componentsDir, moduleName)
              
              if (!fs.statSync(moduleDir).isDirectory()) return
              
              // Check if this module has a target family directory
              const targetDir = path.join(moduleDir, targetFamily)
              
              // Check if there's a symlink for this specific file or the directory exists
              const targetFile = path.join(targetDir, item)
              
              if (fs.existsSync(targetFile) || fs.existsSync(targetDir)) {
                console.log(`[File Copy] Adding root file ${item} to module ${moduleName}`)
                
                // Find the component for this module
                const files = contentCatalog.getFiles()
                const sampleFile = files.find(f => 
                  f.src && 
                  f.src.module === moduleName
                )
                
                if (!sampleFile) {
                  console.log(`[File Copy] Could not find component for module ${moduleName}`)
                  return
                }
                
                const component = sampleFile.src.component
                const version = sampleFile.src.version
                
                // Determine the family name (singular form)
                let familyName
                if (targetFamily === 'partials') familyName = 'partial'
                else if (targetFamily === 'examples') familyName = 'example'
                else if (targetFamily === 'pages') familyName = 'page'
                else familyName = targetFamily
                
                const virtualFile = {
                  contents: content,
                  src: {
                    path: `modules/${moduleName}/${targetFamily}/${item}`,
                    dirname: `modules/${moduleName}/${targetFamily}`,
                    basename: item,
                    stem: path.parse(item).name,
                    extname: path.parse(item).ext,
                    mediaType: item.endsWith('.adoc') ? 'text/asciidoc' : 'text/plain',
                    component: component,
                    version: version,
                    module: moduleName,
                    family: familyName,
                    relative: `modules/${moduleName}/${targetFamily}/${item}`
                  },
                  path: `${component}/${version}/${familyName}/${item}`
                }
                
                contentCatalog.addFile(virtualFile)
                console.log(`[File Copy] ✓ Added root-level virtual file: ${virtualFile.path}`)
              }
            })
          }
        })
        
        // Recursively copy all files from subdirectories
        function copyFilesRecursively(currentSourceDir, relativeSubdir = '') {
          const items = fs.readdirSync(currentSourceDir)
          
          items.forEach((item) => {
            const itemPath = path.join(currentSourceDir, item)
            const stats = fs.statSync(itemPath)
            
            if (stats.isDirectory()) {
              // Recurse into subdirectories
              const newRelativeSubdir = relativeSubdir ? path.join(relativeSubdir, item) : item
              console.log(`[File Copy] Entering directory: ${newRelativeSubdir}`)
              copyFilesRecursively(itemPath, newRelativeSubdir)
            } else if (shouldCopyFile(item)) {
              // Process file
              const filename = item
              const fileRelativePath = relativeSubdir ? path.join(relativeSubdir, filename) : filename
              
              console.log(`[File Copy] Processing file: ${fileRelativePath}`)
              
              // Read the file content
              const content = fs.readFileSync(itemPath)
              
              // Find modules directory
              let componentsDir = path.join(worktree, 'docs', 'modules')
              
              if (!fs.existsSync(componentsDir)) {
                componentsDir = path.join(worktree, 'modules')
                if (!fs.existsSync(componentsDir)) {
                  console.log(`[File Copy] No modules directory found in worktree`)
                  return
                }
              }
              
              // Find all modules
              const modules = fs.readdirSync(componentsDir)
              
              modules.forEach((moduleName) => {
                const moduleDir = path.join(componentsDir, moduleName)
                
                if (!fs.statSync(moduleDir).isDirectory()) return
                
                // Check if this module has a target directory with matching structure
                const targetDir = relativeSubdir 
                  ? path.join(moduleDir, targetFamily, relativeSubdir)
                  : path.join(moduleDir, targetFamily)
                
                // If the target directory exists (or has a symlink), add file to catalog
                if (fs.existsSync(targetDir)) {
                  console.log(`[File Copy] Adding ${fileRelativePath} to module ${moduleName}`)
                  
                  // Find the component for this module
                  const files = contentCatalog.getFiles()
                  const sampleFile = files.find(f => 
                    f.src && 
                    f.src.module === moduleName
                  )
                  
                  if (!sampleFile) {
                    console.log(`[File Copy] Could not find component for module ${moduleName}`)
                    return
                  }
                  
                  const component = sampleFile.src.component
                  const version = sampleFile.src.version
                  
                  // Determine the family name (singular form)
                  let familyName
                  if (targetFamily === 'partials') familyName = 'partial'
                  else if (targetFamily === 'examples') familyName = 'example'  
                  else if (targetFamily === 'pages') familyName = 'page'
                  else familyName = targetFamily
                  
                  // Create a virtual file and add it to the content catalog
                  const virtualFilePath = relativeSubdir
                    ? `modules/${moduleName}/${targetFamily}/${fileRelativePath}`
                    : `modules/${moduleName}/${targetFamily}/${filename}`
                  
                  const virtualFile = {
                    contents: content,
                    src: {
                      path: virtualFilePath,
                      dirname: path.dirname(virtualFilePath),
                      basename: filename,
                      stem: path.parse(filename).name,
                      extname: path.parse(filename).ext,
                      mediaType: filename.endsWith('.adoc') ? 'text/asciidoc' : 'text/plain',
                      component: component,
                      version: version,
                      module: moduleName,
                      family: familyName,
                      relative: virtualFilePath
                    },
                    path: `${component}/${version}/${familyName}/${fileRelativePath}`
                  }
                  
                  contentCatalog.addFile(virtualFile)
                  console.log(`[File Copy] ✓ Added virtual file: ${virtualFile.path}`)
                }
              })
            }
          })
        }
        
        // Start the recursive copy
        copyFilesRecursively(sourceDir)
      })
    })
    
    console.log('[File Copy] Processing complete')
  })

  this.on('sitePublished', async () => {
    const outputDir = resolveOutputDir(playbook)
    if (legacyFiles.length) {
      await copyLegacyFilesToOutput({ legacyFiles, outputDir })
    }

    //if (pdfMirrorEnabled) {
    //  const sourceRoot = resolveRelativeToPlaybook(playbook, pdfsSourceDir)
    //  mirrorPdfArchive({ sourceRoot, outputDir })
    //}
  })
}

async function copyLegacyFilesToOutput ({ legacyFiles, outputDir }) {
  console.log(`[File Copy] Copying legacy files into output: ${outputDir}`)

  let copied = 0
  let skipped = 0
  let failed = 0

  for (const rule of legacyFiles) {
    const versions = Array.isArray(rule.versions) && rule.versions.length ? rule.versions : [null]

    for (const version of versions) {
      const context = { version }
      const sourceUrl = applyTemplate(rule.source_url || rule.sourceUrl, context)
      const targetPath = applyTemplate(rule.target_path || rule.targetPath, context)

      if (!sourceUrl || !targetPath) {
        console.warn('[File Copy] Skipping invalid legacy rule entry (missing source_url/target_path)')
        skipped++
        continue
      }

      const destination = path.join(outputDir, targetPath)
      const shouldOverwrite = rule.overwrite === true

      if (!shouldOverwrite && fs.existsSync(destination)) {
        console.log(`[File Copy] Legacy file already exists (skipping): ${destination}`)
        skipped++
        continue
      }

      try {
        const buffer = await downloadUrlToBuffer(sourceUrl)
        fs.mkdirSync(path.dirname(destination), { recursive: true })
        fs.writeFileSync(destination, buffer)
        console.log(`[File Copy] ✓ Copied legacy file: ${sourceUrl} -> ${destination}`)
        copied++
      } catch (err) {
        console.warn(`[File Copy] Failed to copy legacy file from ${sourceUrl}: ${err.message}`)
        failed++
      }
    }
  }

  console.log(`[File Copy] Legacy copy summary: copied=${copied}, skipped=${skipped}, failed=${failed}`)
}

/*
function mirrorPdfArchive ({ sourceRoot, outputDir }) {
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    console.log(`[File Copy] PDF mirror skipped (source missing): ${sourceRoot}`)
    return
  }

  console.log(`[File Copy] Mirroring PDF archive: ${sourceRoot} -> ${outputDir}`)
  let copied = 0

  copyDirectoryRecursive(sourceRoot, outputDir, () => {
    copied++
  })
  console.log(`[File Copy] PDF mirror complete, files copied: ${copied}`)
}

function copyDirectoryRecursive (sourceDir, destinationDir, onFileCopied) {
  fs.mkdirSync(destinationDir, { recursive: true })
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })

  entries.forEach((entry) => {
    const from = path.join(sourceDir, entry.name)
    const to = path.join(destinationDir, entry.name)

    if (entry.isDirectory()) {
      copyDirectoryRecursive(from, to, onFileCopied)
      return
    }

    if (!entry.isFile()) return

    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
    onFileCopied()
  })
}
*/

function resolveOutputDir(playbook) {
  const configuredOutputDir = playbook?.output?.dir || './build/site'
  const baseDir = playbook?.dir || process.cwd()
  return path.isAbsolute(configuredOutputDir)
    ? configuredOutputDir
    : path.resolve(baseDir, configuredOutputDir)
}

function resolveRelativeToPlaybook (playbook, relativePath) {
  const baseDir = playbook?.dir || process.cwd()
  return path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(baseDir, relativePath)
}

function applyTemplate(template, context = {}) {
  if (!template) return null

  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

function downloadUrlToBuffer(url, redirectCount = 0) {
  const MAX_REDIRECTS = 5
  const client = url.startsWith('https:') ? https : http

  return new Promise((resolve, reject) => {
    const req = client.get(url, {
      headers: {
        'User-Agent': 'antora-copy-files-extension'
      }
    }, (res) => {
      const statusCode = res.statusCode || 0

      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        if (redirectCount >= MAX_REDIRECTS) {
          reject(new Error(`too many redirects while fetching ${url}`))
          return
        }

        const redirectUrl = new URL(res.headers.location, url).toString()
        res.resume()
        resolve(downloadUrlToBuffer(redirectUrl, redirectCount + 1))
        return
      }

      if (statusCode < 200 || statusCode >= 300) {
        res.resume()
        reject(new Error(`HTTP ${statusCode}`))
        return
      }

      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })

    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error(`request timeout for ${url}`)))
  })
}