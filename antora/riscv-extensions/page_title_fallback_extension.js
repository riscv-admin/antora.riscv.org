// Antora extension: page_title_fallback_extension.js
//
// Problem:
//   Many spec source files in this site (e.g. riscv-isa-manual chapter
//   fragments) have a level-1 section heading ("== Title") but no AsciiDoc
//   doctitle ("= Title"). Asciidoctor's own Document#getDocumentTitle()
//   can fall back gracefully to the first section title in this case —
//   confirmed directly against a standalone parse:
//
//     doc.hasHeader()        -> false
//     doc.getDocumentTitle() -> "Machine-Level ISA, Version 1.13"  (correct!)
//
//   But Antora calls getDocumentTitle() at the wrong point in its pipeline
//   to ever see that value. Title/metadata extraction
//   (@antora/document-converter, convert-documents.js) deliberately loads
//   the document with `parse_header_only: true` before calling
//   extractAsciiDocMetadata:
//
//     const headerOverrides = { extensions: [], headerOnly: true }
//     const { attributes } = (page.asciidoc = extractAsciiDocMetadata(
//       loadAsciiDoc(page, contentCatalog, ... headerOverrides)
//     ))
//
//   With header-only parsing, Asciidoctor never parses the document body,
//   so there are no sections yet for getDocumentTitle()'s fallback to find
//   — confirmed by instrumenting this exact call in this exact pipeline:
//   doc.getDocumentTitle() reliably returns undefined here, even for pages
//   where a standalone full parse resolves it correctly. The FULL parse
//   (where a body-derived title would actually be available) only happens
//   later, inside convertDocument (singular), via a second, separate
//   loadAsciiDoc call without headerOnly — but by then `page.asciidoc` has
//   already been set from the empty header-only metadata, and
//   convert-document.js only assigns `page.asciidoc` `if (!file.asciidoc)`
//   — so the full-parse doc's title is computed (Asciidoctor needs it
//   internally to convert headings/TOC) but never captured by Antora into
//   page metadata at all.
//
//   Net effect: `page.title` (a getter that reads `page.asciidoc.doctitle`
//   — see @antora/document-converter's convert-documents.js) stays
//   undefined for ~97% of pages in this site, which is why
//   @cerbos/antora-llm-generator prints "[undefined]" for nearly every
//   entry despite the live site's nav looking correct (the nav builder
//   reads page.asciidoc.navtitle, which has the same gap, but the UI
//   layout's title fallback chain elsewhere papers over it for rendering
//   purposes — it just never reaches the metadata extensions consume).
//
// Fix:
//   Wrap `convertDocument` (not `extractAsciiDocMetadata` — that function
//   structurally never has body content available). `convertDocument` is
//   one of Antora's officially swappable pipeline functions
//   (@antora/site-generator's GeneratorContext.replaceFunctions(),
//   FUNCTION_PROVIDERS). We call through to Antora's real implementation
//   first — completely unchanged behavior for normal pages — and only
//   when the resulting `file.asciidoc.doctitle` is still empty do we read
//   the title off the *fully parsed* document we already have in hand
//   (the conversion's own `doc`, post-convert, which by then has parsed
//   the whole body and can resolve a section-derived title correctly).
//
//   This is strictly additive: pages with a real doctitle are completely
//   untouched, and we're using Asciidoctor's own title-resolution logic
//   rather than a heuristic, so results match the page's own first
//   heading exactly.
//
// Config (all optional):
//   log_fixes: true|false   - log each page whose title was patched (default: true)

'use strict'

// NOTE on module resolution: a bare `require('@antora/document-converter')`
// resolves relative to THIS FILE's location on disk. That works fine when
// everything lives under one local node_modules tree (as in testing), but
// breaks when Antora is installed globally (e.g. `npm install -g antora`)
// while this extension lives inside a separate project repo — Node has no
// path from this file to the global install's bundled @antora/* packages.
// Confirmed directly: "Cannot find module '@antora/document-converter'"
// when run against a real global-install setup.
//
// NOTE on timing: GeneratorContext's own function table
// (`this.getFunctions()`) isn't populated with real implementations until
// AFTER all extensions' register() calls finish (_registerExtensions runs
// before _registerFunctions in generator-context.js) — so capturing
// "the original convertDocument" via getFunctions() doesn't work either,
// neither at register() time (nothing populated yet) nor lazily on first
// call (replaceFunctions has already overwritten that exact table entry
// with our own wrapper by then, which caused infinite recursion when
// tried).
//
// The actual fix: GeneratorContext exposes `this.require(request)`
// specifically for this situation — it resolves against the module that
// instantiated GeneratorContext (i.e. Antora's own install, wherever that
// is, global or local) rather than against the calling file's location:
//
//   require (request, opts = {}) {
//     try { return this.module.require(request) }
//     catch { return (opts.require ?? require)(request) }
//   }
//
// This must be captured during register() (where `this` is the
// GeneratorContext), then used inside the replaced convertDocument.
module.exports.register = function ({ config }) {
  const logger = this.getLogger('page-title-fallback')
  const logFixes = config?.log_fixes !== false
  const { convertDocument: originalConvert } = this.require('@antora/document-converter')
  const { loadAsciiDoc } = this.require('@antora/asciidoc-loader')

  this.replaceFunctions({
    convertDocument (file, contentCatalog, asciidocConfig) {
      // convertDocument (the real implementation we're wrapping) mutates
      // `file.contents` in place, overwriting the original AsciiDoc source
      // with rendered HTML before it returns. Since our title fallback
      // needs to re-parse the AsciiDoc source itself (the header-only
      // parse used for metadata extraction can't see body content), we
      // must snapshot the source now, before calling through.
      const originalSource = file.contents
      const result = originalConvert.call(this, file, contentCatalog, asciidocConfig)

      if (result.asciidoc && !result.asciidoc.doctitle) {
        // Re-parse the original AsciiDoc source fully (no headerOnly),
        // mirroring what convertDocument just did internally to produce
        // result.contents, so we can ask Asciidoctor for its body-aware
        // title fallback. We use a shallow-cloned file with contents reset
        // to the pre-conversion AsciiDoc source, since `file.contents` is
        // now HTML.
        const fullConfig = Object.assign({}, asciidocConfig, { headerOnly: false })
        const sourceFile = Object.assign(Object.create(Object.getPrototypeOf(file)), file, {
          contents: originalSource,
        })
        let fallbackTitle
        try {
          const fullDoc = loadAsciiDoc.call(this, sourceFile, contentCatalog, fullConfig)
          fallbackTitle = fullDoc.getDocumentTitle()
        } catch (e) {
          if (logFixes) logger.warn(`[page-title-fallback] Re-parse failed for ${file.src.path}: ${e.message}`)
        }

        if (fallbackTitle) {
          result.asciidoc.doctitle = fallbackTitle
          if (!result.asciidoc.xreftext) result.asciidoc.xreftext = fallbackTitle
          if (!result.asciidoc.navtitle) result.asciidoc.navtitle = fallbackTitle
          if (logFixes) {
            logger.info(`[page-title-fallback] ${file.src.path} -> "${fallbackTitle}" (no doctitle; used first section title)`)
          }
        }
      }

      return result
    },
  })
}
