'use strict'

const fs = require('fs')
const path = require('path')

module.exports.register = function () {
  const logger = this.getLogger('latest-version-root-redirect-extension')

  this.on('sitePublished', ({ contentCatalog, playbook }) => {
    const playbookDir = playbook?.dir || process.cwd()
    const outputDir = resolveOutputDir(playbook)
    let redirectsWritten = 0
    let versionPdfsCopied = 0
    let rootPdfLinksCreated = 0

    for (const component of contentCatalog.getComponents()) {
      const latestVersion = component?.latest?.version
      const componentName = component?.name
      if (!componentName || !latestVersion) continue

      const latestPages = contentCatalog.findBy({ component: componentName, version: latestVersion, family: 'page' })
      for (const page of latestPages) {
        const publishedPath = getPublishedPath(page, componentName, latestVersion)
        const latestPagePath = path.join(outputDir, publishedPath)
        if (!fs.existsSync(latestPagePath)) continue

        const redirectRelativePath = getRedirectRelativePath(page)
        const redirectPagePath = path.posix.join(componentName, redirectRelativePath)
        const redirectPath = path.join(outputDir, redirectPagePath)
        fs.mkdirSync(path.dirname(redirectPath), { recursive: true })
        const redirectTarget = path.posix.relative(path.posix.dirname(redirectPagePath), publishedPath)
        fs.writeFileSync(redirectPath, buildRedirectHtml(redirectTarget, componentName, latestVersion))
        redirectsWritten += 1
      }

      const pdfSyncStats = syncLatestPdfArtifacts(playbookDir, outputDir, componentName, latestVersion, logger)
      versionPdfsCopied += pdfSyncStats.copied
      rootPdfLinksCreated += pdfSyncStats.linked
    }

    logger.info(`Latest-version root redirects complete (${redirectsWritten} redirect(s) written, ${versionPdfsCopied} versioned PDF(s) copied, ${rootPdfLinksCreated} root PDF link(s) created)`)
  })
}

function resolveOutputDir(playbook) {
  const playbookDir = playbook?.dir || process.cwd()
  const outputDir = playbook?.output?.dir || './build/site'
  return path.resolve(playbookDir, outputDir)
}

function buildRedirectHtml(target, componentName, latestVersion) {
  const escapedTarget = escapeHtml(target)
  const escapedComponent = escapeHtml(componentName)
  const escapedVersion = escapeHtml(latestVersion)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${escapedTarget}">
    <link rel="canonical" href="${escapedTarget}">
    <title>Redirecting to ${escapedComponent} ${escapedVersion}</title>
  </head>
  <body>
    <p>Redirecting to the latest version: <a href="${escapedTarget}">${escapedComponent} ${escapedVersion}</a></p>
  </body>
</html>
`
}

function getPublishedPath(page, componentName, latestVersion) {
  const relativePath = getSourceRelativePath(page).replace(/\.adoc$/, '.html')
  const segments = [componentName, latestVersion]
  if (page.src?.module && page.src.module !== 'ROOT') segments.push(page.src.module)
  segments.push(relativePath)
  return path.posix.join(...segments)
}

function getRedirectRelativePath(page) {
  const relativePath = getSourceRelativePath(page).replace(/\.adoc$/, '.html')
  const segments = []
  if (page.src?.module && page.src.module !== 'ROOT') segments.push(page.src.module)
  segments.push(relativePath)
  return path.posix.join(...segments)
}

function getSourceRelativePath(page) {
  return page.src?.relative || page.src?.basename || ''
}

function syncLatestPdfArtifacts(playbookDir, outputDir, componentName, latestVersion, logger) {
  const componentPdfDir = path.join(playbookDir, 'pdfs', componentName)
  if (!fs.existsSync(componentPdfDir)) {
    return { copied: 0, linked: 0 }
  }

  const sourceDir = path.join(componentPdfDir, latestVersion, '_attachments')
  if (!fs.existsSync(sourceDir)) {
    logger.warn(`No versioned PDF source for ${componentName}@${latestVersion} at ${sourceDir}`)
    return { copied: 0, linked: 0 }
  }

  const versionTargetDir = path.join(outputDir, componentName, latestVersion, '_attachments')
  const rootTargetDir = path.join(outputDir, componentName, '_attachments')
  fs.mkdirSync(versionTargetDir, { recursive: true })
  fs.mkdirSync(rootTargetDir, { recursive: true })

  let copied = 0
  let linked = 0

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.pdf') continue

    const sourceFile = path.join(sourceDir, entry.name)
    const versionTargetFile = path.join(versionTargetDir, entry.name)
    const rootTargetFile = path.join(rootTargetDir, entry.name)

    fs.copyFileSync(sourceFile, versionTargetFile)
    copied += 1

    ensureSymlink(rootTargetFile, versionTargetFile)
    linked += 1
  }

  return { copied, linked }
}

function ensureSymlink(linkPath, targetPath) {
  if (fs.existsSync(linkPath) || isSymlink(linkPath)) {
    fs.unlinkSync(linkPath)
  }

  const relativeTarget = path.relative(path.dirname(linkPath), targetPath)
  fs.symlinkSync(relativeTarget, linkPath)
}

function isSymlink(filePath) {
  try {
    return fs.lstatSync(filePath).isSymbolicLink()
  } catch (_error) {
    return false
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}