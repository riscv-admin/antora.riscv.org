'use strict'

const fs = require('fs')
const path = require('path')

module.exports.register = function () {
  const logger = this.getLogger('latest-version-root-redirect-extension')

  this.on('sitePublished', ({ contentCatalog, playbook }) => {
    const outputDir = resolveOutputDir(playbook)
    let redirectsWritten = 0

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
    }

    logger.info(`Latest-version root redirects complete (${redirectsWritten} redirect(s) written)`)
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}