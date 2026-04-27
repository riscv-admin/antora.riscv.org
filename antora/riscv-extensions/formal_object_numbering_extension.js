'use strict'

const fs = require('fs')
const path = require('path')

module.exports.register = function () {
  const logger = this.getLogger('formal-object-numbering-extension')

  this.on('sitePublished', ({ contentCatalog, playbook }) => {
    const navOrderByGroup = buildNavOrderMap(contentCatalog)
    const pageFiles = contentCatalog.findBy({ family: 'page' })
    const outputDir = resolveOutputDir(playbook)

    const pagesByGroup = new Map()
    for (const pageFile of pageFiles) {
      const groupKey = getGroupKey(pageFile)
      if (!pagesByGroup.has(groupKey)) pagesByGroup.set(groupKey, [])
      pagesByGroup.get(groupKey).push(pageFile)
    }

    let groupsProcessed = 0
    let captionsUpdated = 0
    let refsUpdated = 0

    for (const [groupKey, pages] of pagesByGroup.entries()) {
      const pageOrder = navOrderByGroup.get(groupKey) || new Map()
      const orderedPages = [...pages].sort((left, right) => comparePages(left, right, pageOrder))
      const objectNumbers = new Map()
      let figureCounter = 0
      let tableCounter = 0

      for (const page of orderedPages) {
        const publishedPath = getPublishedPath(page, contentCatalog, playbook)
        const absolutePath = path.join(outputDir, publishedPath)
        if (!fs.existsSync(absolutePath)) continue

        let html = fs.readFileSync(absolutePath, 'utf8')
        if (!mayContainFormalObjects(html)) continue

        const captionResult = renumberCaptionsInHtml({
          html,
          groupKey,
          pagePath: publishedPath,
          startTable: tableCounter,
          startFigure: figureCounter,
          objectNumbers,
        })

        tableCounter = captionResult.tableCounter
        figureCounter = captionResult.figureCounter
        captionsUpdated += captionResult.updated

        if (captionResult.changed) {
          html = captionResult.html
          fs.writeFileSync(absolutePath, html)
        }
      }

      for (const page of orderedPages) {
        const publishedPath = getPublishedPath(page, contentCatalog, playbook)
        const absolutePath = path.join(outputDir, publishedPath)
        if (!fs.existsSync(absolutePath)) continue

        const html = fs.readFileSync(absolutePath, 'utf8')
        if (!mayContainFormalObjectRefs(html)) continue

        const refResult = renumberRefsInHtml({
          html,
          groupKey,
          pagePath: publishedPath,
          objectNumbers,
        })

        refsUpdated += refResult.updated
        if (refResult.changed) {
          fs.writeFileSync(absolutePath, refResult.html)
        }
      }

      if (objectNumbers.size > 0) groupsProcessed += 1
    }

    logger.info(`Formal object numbering complete (${groupsProcessed} group(s), ${captionsUpdated} caption(s), ${refsUpdated} reference(s) updated from ${pageFiles.length} page(s))`)
  })
}

function buildNavOrderMap(contentCatalog) {
  const navOrderByGroup = new Map()
  const navFiles = contentCatalog.getFiles().filter((file) => file.src?.family === 'nav')

  for (const navFile of navFiles) {
    const groupKey = getGroupKey(navFile)
    if (!navOrderByGroup.has(groupKey)) navOrderByGroup.set(groupKey, new Map())
    const pageOrder = navOrderByGroup.get(groupKey)
    const lines = navFile.contents.toString().split('\n')
    let order = 0

    for (const line of lines) {
      const xrefMatch = /^\*+\s+xref:([^\[]+)\[/.exec(line)
      if (!xrefMatch) continue

      const target = normalizeXrefTarget(xrefMatch[1])
      if (!target || pageOrder.has(target)) continue

      pageOrder.set(target, order)
      order += 1
    }
  }

  return navOrderByGroup
}

function comparePages(left, right, pageOrder) {
  const leftPath = getSourceRelativePath(left)
  const rightPath = getSourceRelativePath(right)
  const leftOrder = getPageOrder(pageOrder, left, leftPath)
  const rightOrder = getPageOrder(pageOrder, right, rightPath)

  if (leftOrder !== rightOrder) return leftOrder - rightOrder
  return leftPath.localeCompare(rightPath)
}

function getPageOrder(pageOrder, page, sourceRelativePath) {
  const basename = page.src?.basename
  if (pageOrder.has(sourceRelativePath)) return pageOrder.get(sourceRelativePath)
  if (basename && pageOrder.has(basename)) return pageOrder.get(basename)
  return Number.MAX_SAFE_INTEGER
}

function normalizeXrefTarget(target) {
  const pageRef = String(target).split('#')[0].split(':').pop()
  if (!pageRef || !pageRef.endsWith('.adoc')) return null
  return pageRef
}

function getGroupKey(file) {
  const component = file.src?.component || ''
  const moduleName = file.src?.module || ''
  const refname = file.src?.origin?.refname || file.src?.version || ''
  return `${component}::${moduleName}::${refname}`
}

function getSourceRelativePath(file) {
  return file.src?.relative || file.src?.basename || ''
}

function getPublishedPath(file, contentCatalog, playbook) {
  const component = contentCatalog.getComponent(file.src?.component)
  const latestVersion = component?.latest?.version
  const latestVersionSegment = playbook?.urls?.latest_version_segment
  const parts = [file.src?.component].filter(Boolean)

  if (shouldIncludeVersionSegment(file.src?.version, latestVersion, latestVersionSegment)) {
    parts.push(file.src.version)
  }

  if (file.src?.module && file.src.module !== 'ROOT') {
    parts.push(file.src.module)
  }

  parts.push(getSourceRelativePath(file).replace(/\.adoc$/, '.html'))
  return path.posix.join(...parts)
}

function makeObjectKey(groupKey, pagePath, id) {
  return `${groupKey}::${pagePath}#${id}`
}

function renumberCaptionsInHtml({ html, groupKey, pagePath, startTable, startFigure, objectNumbers }) {
  let tableCounter = startTable
  let figureCounter = startFigure
  let updated = 0
  let changed = false

  const tableRegex = /<table\b([^>]*)>[\s\S]*?<caption class="title">Table\s+\d+\./g
  html = html.replace(tableRegex, (full, attrs) => {
    const id = getAttr(attrs, 'id')
    const className = getAttr(attrs, 'class') || ''
    if (!id || !className.includes('tableblock')) return full

    tableCounter += 1
    objectNumbers.set(makeObjectKey(groupKey, pagePath, id), { kind: 'Table', number: tableCounter })

    const replaced = full.replace(/<caption class="title">Table\s+\d+\./, `<caption class="title">Table ${tableCounter}.`)
    if (replaced !== full) {
      updated += 1
      changed = true
    }
    return replaced
  })

  const figureRegex = /<div\b(?=[^>]*\bclass=("|')[^"']*\bimageblock\b[^"']*\1)([^>]*)>[\s\S]*?<div class="title">Figure\s+\d+\./g
  html = html.replace(figureRegex, (full, _quote, attrs) => {
    const id = getAttr(attrs, 'id')
    const className = getAttr(attrs, 'class') || ''
    if (!id || !className.includes('imageblock')) return full

    figureCounter += 1
    objectNumbers.set(makeObjectKey(groupKey, pagePath, id), { kind: 'Figure', number: figureCounter })

    const replaced = full.replace(/<div class="title">Figure\s+\d+\./, `<div class="title">Figure ${figureCounter}.`)
    if (replaced !== full) {
      updated += 1
      changed = true
    }
    return replaced
  })

  return { html, tableCounter, figureCounter, updated, changed }
}

function renumberRefsInHtml({ html, groupKey, pagePath, objectNumbers }) {
  let updated = 0
  let changed = false

  const anchorRegex = /<a\b[^>]*href=("|')([^"']*#[^"']+)\1[^>]*>(Figure|Table)\s+\d+<\/a>/g
  html = html.replace(anchorRegex, (full, quote, href, kind) => {
    const target = resolveTarget(pagePath, href)
    if (!target) return full

    const objectRef = objectNumbers.get(makeObjectKey(groupKey, target.pagePath, target.id))
    if (!objectRef || objectRef.kind !== kind) return full

    const nextLabel = `${objectRef.kind} ${objectRef.number}`
    const replaced = full.replace(/>(Figure|Table)\s+\d+</, `>${nextLabel}<`)
    if (replaced !== full) {
      updated += 1
      changed = true
    }
    return replaced
  })

  return { html, updated, changed }
}

function getAttr(attrs, name) {
  const pattern = new RegExp(`${name}=("|')([^"']+)\\1`)
  const match = pattern.exec(attrs)
  if (match) return match[2]
  return null
}

function mayContainFormalObjects(html) {
  return html.includes('tableblock') || html.includes('imageblock')
}

function mayContainFormalObjectRefs(html) {
  return html.includes('#') && (html.includes('Figure ') || html.includes('Table '))
}

function resolveTarget(currentPagePath, href) {
  if (!href || /^[a-z]+:/i.test(href)) return null

  const [rawPath, rawHash] = href.split('#')
  if (!rawHash) return null

  const targetPagePath = rawPath
    ? path.posix.normalize(path.posix.join(path.posix.dirname(currentPagePath), rawPath))
    : currentPagePath

  return {
    pagePath: targetPagePath,
    id: decodeURIComponent(rawHash),
  }
}

function shouldIncludeVersionSegment(pageVersion, latestVersion, latestVersionSegment) {
  if (!pageVersion) return false
  if (pageVersion !== latestVersion) return true
  return Boolean(latestVersionSegment)
}

function resolveOutputDir(playbook) {
  const playbookDir = playbook?.dir || process.cwd()
  const outputDir = playbook?.output?.dir || './build/site'
  return path.resolve(playbookDir, outputDir)
}