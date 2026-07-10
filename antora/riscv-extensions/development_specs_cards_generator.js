'use strict'
//
// development_specs_cards_generator.js
//
// Antora extension that generates development spec bands from a local YAML file.
//
// Reads development-specs.yml and injects bands on the home page wherever
// the marker comment appears:
//
//   // DEVELOPMENT-CARDS
//
// Each entry in development-specs.yml should have:
//   - title: Display name
//   - status: draft, frozen, review, etc.
//   - html-url: URL to HTML docs
//   - pdf-url: URL to PDF (optional)
//   - details-url: URL to project page
//   - group: ISA or Non-ISA
//   - fast-tracked: true/false (optional)
//

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

module.exports.register = function () {
  this.on('contentClassified', ({ contentCatalog, playbook }) => {
    // ----------------------------------------------------------------
    // 1. Read development-specs.yml from the playbook directory
    // ----------------------------------------------------------------
    const playbookDir = path.dirname(playbook.file)
    const devSpecsPath = path.join(playbookDir, 'development-specs.yml')

    let devSpecs = []
    if (!fs.existsSync(devSpecsPath)) {
      console.log('[development-specs-bands] development-specs.yml not found — skipping.')
      return
    }

    try {
      const fileContent = fs.readFileSync(devSpecsPath, 'utf8')
      const data = yaml.load(fileContent)
      devSpecs = (data && data['development-specs']) || []
      if (!Array.isArray(devSpecs)) {
        console.warn('[development-specs-bands] development-specs.yml "development-specs" is not an array — skipping.')
        return
      }
    } catch (err) {
      console.error(`[development-specs-bands] Error reading development-specs.yml: ${err.message}`)
      return
    }

    devSpecs = devSpecs.filter(spec => spec.title && spec.status && spec.group)

    console.log(`[development-specs-bands] Loaded ${devSpecs.length} development specs`)
    if (devSpecs.length === 0) {
      console.log('[development-specs-bands] No development specs found in development-specs.yml — skipping.')
      return
    }

    // ----------------------------------------------------------------
    // 2. Find the home page (site-home component, ROOT module, index.adoc)
    // ----------------------------------------------------------------
    const homePages = contentCatalog.findBy({
      component: 'home',
      module: 'ROOT',
      family: 'page',
      relative: 'index.adoc'
    })

    if (!homePages.length) {
      console.log('[development-specs-bands] No home index.adoc page found — skipping.')
      return
    }

    // ----------------------------------------------------------------
    // 3. Inject bands into each home page at the marker
    // ----------------------------------------------------------------
    homePages.forEach((page) => {
      let content = page.contents.toString()
      const markerRe = /^\/\/ DEVELOPMENT-CARDS$/gm

      const replaced = content.replace(markerRe, () => {
        return buildSpecsContainer(devSpecs)
      })

      if (replaced !== content) {
        page.contents = Buffer.from(replaced)
        console.log(`[development-specs-bands] Injected ${devSpecs.length} development spec bands into home page.`)
      }
    })
  })
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function buildSpecsContainer(specs) {
  const searchHtml = `<div class="dev-specs-search"><input type="text" placeholder="Search specifications..."></div>`

  const statusOrder = ['planning', 'under development', 'stabilization', 'freeze', 'ratification-ready']
  const uniqueStatuses = [...new Set(specs.map(s => s.status))].sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b))
  const allStatusBtn = '<button class="filter-btn filter-all-status active" data-type="status-all">All States</button>'
  const statusBtns = allStatusBtn + uniqueStatuses
    .map(status => {
      const label = status.charAt(0).toUpperCase() + status.slice(1)
      return `<button class="filter-btn" data-type="status" data-value="${status}">${label}</button>`
    })
    .join('')

  const groupFilters = [...new Set(specs.map(s => s.group))].sort()
  const groupBtns = groupFilters
    .map(group => `<button class="filter-btn" data-type="group" data-value="${group}">${group}</button>`)
    .join('')

  const hasFastTrack = specs.some(s => s['fast-tracked'])
  const fastTrackBtn = hasFastTrack ? '<button class="filter-btn" data-type="fasttrack" data-value="true">Fast Track</button>' : ''

  const sortHtml = `<select class="sort-select"><option value="name">Sort by Name</option><option value="state">Sort by State</option></select>`

  const bands = specs.map(buildBand).join('\n')

  return `++++
<div class="dev-specs-container">
  <div class="dev-specs-filters">
    ${searchHtml}
    <div class="dev-specs-state-filters">
      <div class="filter-group">
        ${statusBtns}
      </div>
    </div>
    <div class="dev-specs-controls">
      <div class="filter-group">
        ${groupBtns}
      </div>
      ${fastTrackBtn}
      ${sortHtml}
    </div>
  </div>
  <div class="dev-specs-bands">
${bands}
  </div>
</div>
++++`
}

function buildBand(spec) {
  const htmlButton = spec['html-url']
    ? `<a href="${spec['html-url']}" class="spec-button">🌐 HTML</a>`
    : `<span class="spec-button spec-button--disabled">🌐 HTML</span>`

  const pdfButton = spec['pdf-url']
    ? `<a href="${spec['pdf-url']}" class="spec-button" target="_blank" rel="noopener noreferrer">📄 PDF</a>`
    : `<span class="spec-button spec-button--disabled">📄 PDF</span>`

  const moreLink = spec['details-url']
    ? `<a href="${spec['details-url']}" class="spec-more-link" target="_blank" rel="noopener noreferrer">→ More details</a>`
    : ''

  const statusIndicator = getStatusIndicator(spec.status)
  const fastTrackLabel = spec['fast-tracked'] ? '<span class="fast-track-label">Fast Track</span>' : ''

  return `    <div class="dev-spec-band" data-status="${spec.status.toLowerCase()}" data-group="${escapeHtml(spec.group)}" data-fast-track="${spec['fast-tracked'] ? 'true' : 'false'}">
      <div class="band-title">${escapeHtml(spec.title)}</div>
      <div class="band-meta">
        <span class="status-badge">${statusIndicator} ${escapeHtml(spec.status.charAt(0).toUpperCase() + spec.status.slice(1))}</span>
        <span class="group-label">${escapeHtml(spec.group)}</span>
        ${fastTrackLabel}
      </div>
      <div class="band-actions">
        ${htmlButton}
        ${pdfButton}
        ${moreLink}
      </div>
    </div>`
}

function getStatusIndicator(status) {
  const indicators = {
    'planning': '📋',
    'under development': '🔨',
    'stabilization': '⚙️',
    'freeze': '🔵',
    'ratification-ready': '🟢'
  }
  return indicators[status.toLowerCase()] || '⭕'
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
