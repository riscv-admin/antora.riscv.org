'use strict'

const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')

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

        const html = fs.readFileSync(absolutePath, 'utf8')
        if (!mayContainFormalObjects(html)) continue

        let dom
        try {
          dom = new JSDOM(html)
          const document = dom.window.document
          const pagePath = publishedPath
          let pageChanged = false

          for (const table of document.querySelectorAll('table.tableblock[id]')) {
            const caption = table.querySelector('caption.title')
            if (!caption) continue
            tableCounter += 1
            const objectKey = makeObjectKey(groupKey, pagePath, table.id)
            objectNumbers.set(objectKey, { kind: 'Table', number: tableCounter })
            const updated = replaceLeadingLabel(caption, 'Table', tableCounter)
            captionsUpdated += updated
            pageChanged = pageChanged || updated > 0
          }

          for (const figure of document.querySelectorAll('div.imageblock[id]')) {
            const caption = findDirectChildByClass(figure, 'title')
            if (!caption) continue
            figureCounter += 1
            const objectKey = makeObjectKey(groupKey, pagePath, figure.id)
            objectNumbers.set(objectKey, { kind: 'Figure', number: figureCounter })
            const updated = replaceLeadingLabel(caption, 'Figure', figureCounter)
            captionsUpdated += updated
            pageChanged = pageChanged || updated > 0
          }

          if (pageChanged) fs.writeFileSync(absolutePath, dom.serialize())
        } finally {
          if (dom) dom.window.close()
        }
      }

      for (const page of orderedPages) {
        const publishedPath = getPublishedPath(page, contentCatalog, playbook)
        const absolutePath = path.join(outputDir, publishedPath)
        if (!fs.existsSync(absolutePath)) continue

        const html = fs.readFileSync(absolutePath, 'utf8')
        if (!mayContainFormalObjectRefs(html)) continue

        let dom
        try {
          dom = new JSDOM(html)
          const document = dom.window.document
          const pagePath = publishedPath
          let pageChanged = false

          for (const anchor of document.querySelectorAll('a[href*="#"]')) {
            const label = anchor.textContent.trim()
            const labelMatch = /^(Figure|Table)\s+\d+$/.exec(label)
            if (!labelMatch) continue

            const target = resolveTarget(pagePath, anchor.getAttribute('href'))
            if (!target) continue

            const objectKey = makeObjectKey(groupKey, target.pagePath, target.id)
            const objectRef = objectNumbers.get(objectKey)
            if (!objectRef || objectRef.kind !== labelMatch[1]) continue

            const nextLabel = `${objectRef.kind} ${objectRef.number}`
            if (anchor.textContent !== nextLabel) {
              anchor.textContent = nextLabel
              refsUpdated += 1
              pageChanged = true
            }
          }

          if (pageChanged) fs.writeFileSync(absolutePath, dom.serialize())
        } finally {
          if (dom) dom.window.close()
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

function findDirectChildByClass(element, className) {
  for (const child of element.children) {
    if (child.classList.contains(className)) return child
  }
  return null
}

function mayContainFormalObjects(html) {
  return html.includes('tableblock') || html.includes('imageblock')
}

function mayContainFormalObjectRefs(html) {
  return html.includes('href="#') && (html.includes('Figure ') || html.includes('Table '))
}

function replaceLeadingLabel(element, kind, number) {
  const nextPrefix = `${kind} ${number}.`
  const nextHtml = element.innerHTML.replace(new RegExp(`^${kind}\\s+\\d+\\.`), nextPrefix)
  if (nextHtml === element.innerHTML) return 0
  element.innerHTML = nextHtml
  return 1
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