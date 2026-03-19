'use strict'
//
// homepage_cards_generator.js
//
// Antora extension that auto-generates the spec card grid on the site homepage.
//
// Each content source signals its presence on the homepage by setting these
// attributes either in its antora.yml OR in the playbook's per-source
// asciidoc.attributes block (the extension checks both, with antora.yml winning):
//
//   asciidoc:
//     attributes:
//       page-group:            platform-software   # grouping key
//       page-card-description: 'Short card body text'
//       page-pdf_url:          '_attachments/spec.pdf'   # relative or full URL
//       more_details_url:      'https://confluence.example.com/...'
//
// NOTE: Antora does NOT automatically merge playbook source-level
// asciidoc.attributes into componentVersion.asciidoc.attributes, so this
// extension reads the playbook directly for any attributes not found in antora.yml.
//
// In site-home/modules/ROOT/pages/index.adoc, place a marker comment wherever
// you want a card grid injected for that group:
//
//   == Platform Software
//   // GENERATED-CARDS:platform-software
//
// The marker is replaced with the passthrough HTML card grid at build time.
// Components without page-group are silently skipped (e.g. home, common).
//

module.exports.register = function () {
    this.on('contentClassified', ({ contentCatalog, playbook }) => {
        // ----------------------------------------------------------------
        // 0. Build a lookup map: source URL → source-level asciidoc attrs.
        //    Antora does NOT merge playbook source-level asciidoc.attributes
        //    into componentVersion.asciidoc.attributes — only antora.yml attrs
        //    end up there.  Card metadata (page-card-description, page-pdf_url,
        //    more_details_url) lives in the playbook, so we read it here and
        //    fall back to it when the component descriptor lacks the attribute.
        // ----------------------------------------------------------------
        const sourceAttrsByUrl = new Map()
        for (const source of (playbook?.content?.sources || [])) {
            if (source.asciidoc?.attributes) {
                sourceAttrsByUrl.set(source.url, source.asciidoc.attributes)
            }
        }

        // ----------------------------------------------------------------
        // 1. Collect one entry per component (latest version only).
        //    A component is included only if it declares page-group.
        // ----------------------------------------------------------------
        const specsByGroup = new Map()

        contentCatalog.getComponents().forEach((component) => {
            // Use the latest (first) version — that is what the homepage links to.
            const latestVersion = component.latest || component.versions[0]
            if (!latestVersion) return

            const attrs = (latestVersion.asciidoc && latestVersion.asciidoc.attributes) || {}
            const group = attrs['page-group']
            if (!group) return

            // Resolve source-level playbook attributes as a fallback.
            // Find any page from this component version to get its origin URL,
            // then look up the corresponding playbook source entry.
            let sourceAttrs = {}
            const pages = contentCatalog.findBy({ component: component.name, version: latestVersion.version, family: 'page' })
            if (pages.length) {
                const originUrl = pages[0].src?.origin?.url
                if (originUrl) sourceAttrs = sourceAttrsByUrl.get(originUrl) || {}
            }

            // NOTE: antora.yml attributes keep their original hyphenated names (the
            // aggregator stops camelCasing at the 'asciidoc' key).  Playbook
            // source-level attributes are fully camelCased by the playbook builder
            // (page-card-description → pageCardDescription, etc.).
            const entry = {
                name:        component.name,
                title:       latestVersion.title || component.title || component.name,
                description: attrs['page-card-description'] || sourceAttrs['pageCardDescription'] || '',
                pdfUrl:      attrs['page-pdf_url'] || sourceAttrs['pagePdfUrl'] || null,
                detailsUrl:  attrs['more_details_url'] || sourceAttrs['moreDetailsUrl'] || null,
            }

            if (!specsByGroup.has(group)) specsByGroup.set(group, [])

            // Emit two cards for ISA: one per book (unprivileged + privileged).
            if (component.name === 'isa') {
                const unprivDescription = attrs['page-unpriv-description'] || sourceAttrs['pageUnprivDescription'] || 'User-level instruction set and standard extensions.'
                const privDescription = attrs['page-priv-description'] || sourceAttrs['pagePrivDescription'] || 'Privileged architecture, execution modes, and system control.'
                const unprivPdfUrl = attrs['page-unpriv-pdf_url'] || sourceAttrs['pageUnprivPdfUrl'] || '_attachments/riscv-unprivileged.pdf'
                const privPdfUrl = attrs['page-priv-pdf_url'] || sourceAttrs['pagePrivPdfUrl'] || '_attachments/riscv-privileged.pdf'
                const unprivDetailsUrl = attrs['more_details_unpriv_url'] || sourceAttrs['moreDetailsUnprivUrl'] || entry.detailsUrl
                const privDetailsUrl = attrs['more_details_priv_url'] || sourceAttrs['moreDetailsPrivUrl'] || entry.detailsUrl

                specsByGroup.get(group).push({
                    ...entry,
                    title: 'RISC-V Unprivileged ISA Specification',
                    description: unprivDescription,
                    pdfUrl: unprivPdfUrl,
                    detailsUrl: unprivDetailsUrl,
                })
                specsByGroup.get(group).push({
                    ...entry,
                    title: 'RISC-V Privileged ISA Specification',
                    description: privDescription,
                    pdfUrl: privPdfUrl,
                    detailsUrl: privDetailsUrl,
                })
                return
            }

            specsByGroup.get(group).push(entry)
        })

        if (specsByGroup.size === 0) {
            console.log('[homepage-cards] No components with page-group found — skipping.')
            return
        }

        // ----------------------------------------------------------------
        // 2. Find the homepage index.adoc (component: home, ROOT module).
        // ----------------------------------------------------------------
        const homePage = contentCatalog.findBy({ component: 'home', module: 'ROOT', family: 'page', relative: 'index.adoc' })[0]
        if (!homePage) {
            console.log('[homepage-cards] home::ROOT:index.adoc not found — skipping.')
            return
        }

        // ----------------------------------------------------------------
        // 3. Replace section header + marker pairs with a collapsible section
        //    whose summary is the section header text.
        //    Fallback: if only marker lines are present, replace those with
        //    the card grid only.
        // ----------------------------------------------------------------
        let content = homePage.contents.toString()
        const sectionRe = /(?:^\[#([^\]]+)\]\n)?^==\s+(.+)\n(?:\n)*^\/\/ GENERATED-CARDS:(.+)$/gm
        const markerRe = /^\/\/ GENERATED-CARDS:(.+)$/gm
        let replaced = 0
        let sectionIndex = 0

        content = content.replace(sectionRe, (_, anchorId, headingText, group) => {
            const specs = specsByGroup.get(group.trim())
            if (!specs || specs.length === 0) {
                console.log(`[homepage-cards] No specs found for group '${group}' — section left empty.`)
                return ''
            }
            replaced++
            const isOpen = sectionIndex === 0
            sectionIndex++
            return buildCollapsibleSection(specs, headingText.trim(), anchorId, isOpen)
        })

        content = content.replace(markerRe, (_, group) => {
            const specs = specsByGroup.get(group.trim())
            if (!specs || specs.length === 0) {
                console.log(`[homepage-cards] No specs found for group '${group}' — marker left empty.`)
                return ''
            }
            replaced++
            return buildCardGrid(specs)
        })

        if (replaced > 0) {
            homePage.contents = Buffer.from(content)
            console.log(`[homepage-cards] Injected card grids for ${replaced} group(s).`)
        } else {
            console.log('[homepage-cards] No GENERATED-CARDS markers found in home::ROOT:index.adoc.')
        }
    })
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Builds the AsciiDoc passthrough block containing the card grid HTML
 * for a list of spec entries within one group.
 */
function buildCardGrid(specs) {
    const cards = specs.map(buildCard).join('\n')
    return `++++
<details class="section-cards-toggle">
\t<summary>Show section cards</summary>
<div class="card-grid card-grid-3">
${cards}
</div>
</details>
++++`
}

/**
 * Builds a full collapsible section where the summary text is the section
 * heading itself.
 */
function buildCollapsibleSection(specs, headingText, anchorId, isOpen) {
    const cards = specs.map(buildCard).join('\n')
    const idAttr = anchorId ? ` id="${escapeHtml(anchorId)}"` : ''
    const openAttr = isOpen ? ' open' : ''
    return `++++
<details class="section-cards-toggle"${idAttr}${openAttr}>
	<summary>${escapeHtml(headingText)}</summary>
<div class="card-grid card-grid-3">
${cards}
</div>
</details>
++++`
}

/**
 * Builds one card's HTML for a single spec entry.
 * Paths use '../' prefix because the home page lives at home/index.html,
 * one level below the site root where all component directories reside.
 */
function buildCard(spec) {
    const htmlHref = `../${spec.name}/index.html`
    const pdfButton  = buildPdfButton(spec)
    const moreLink   = spec.detailsUrl
        ? `<a href="${spec.detailsUrl}" class="card-more-link" target="_blank" rel="noopener noreferrer">More details</a>`
        : ''

    return `\t<div class="card shadow-tl card--xxs">
\t\t<div class="card-header"><h5>${escapeHtml(spec.title)}</h5></div>
\t\t<div class="card-body">${escapeHtml(spec.description)}</div>
\t\t<div class="card-footer"><div class="card-actions">${pdfButton}<a href="${htmlHref}" class="button button--primary">HTML</a></div>${moreLink}</div>
\t</div>`
}

/**
 * Returns the PDF button HTML.
 * - If page-pdf_url starts with http(s), treat as an external link (no download attr).
 * - If it looks like a relative path (e.g. _attachments/spec.pdf), prefix '../{component}'
 *   so the path resolves correctly from home/index.html to the site root.
 * - If absent, renders a disabled placeholder.
 */
function buildPdfButton(spec) {
    if (!spec.pdfUrl) {
        return `<span class="button button--secondary button--disabled">PDF</span>`
    }
    if (/^https?:\/\//i.test(spec.pdfUrl)) {
        return `<a href="${spec.pdfUrl}" class="button button--secondary" target="_blank" rel="noopener noreferrer">PDF</a>`
    }
    // Relative path — prepend '../{component}' to navigate up from home/ to site root.
    const href = `../${spec.name}/${spec.pdfUrl.replace(/^\//, '')}`
    return `<a href="${href}" class="button button--secondary" target="_blank" rel="noopener noreferrer">PDF</a>`
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
