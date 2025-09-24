'use strict'
//-------------
//-------------
// Module creating attachments as zip files from input files.
// This module provides one central function, 'generateAttachments', that collects provided files and compresses them into a zip file.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------
const ContentAnalyzer = require('../../core/content_analyzer.js')
const AdmZip = require("adm-zip");
const path = require('path');
const File = require('../../core/file.js');

/**
 * Generates attachments for the download dropdown based on an asciidoc attribute set on the page or the component.
 * @param {Object} contentAggregate - The contentAggregate variable from Antora.
 */
function generateAttachments(contentAggregate) {
    console.log("Checking for generated attachments...")
    contentAggregate.forEach(v => {
        if (!(v.asciidoc && v.asciidoc.attributes)){
            return
        }
        if(v.asciidoc.attributes['generate-attachments'] && v.asciidoc.attributes['generate-attachments'].length > 0) {
            console.log(`Generating attachments for ${v.name}: ${v.version}`)
            const inputAttachmentArray = v.asciidoc.attributes['generate-attachments']
            inputAttachmentArray.forEach(entry => {
                const zip = new AdmZip()
                const clean = entry[2] && entry[2] === "clean" ? true : false
                const inputPath = ContentAnalyzer.getSrcPathFromFileId(entry[0])
                const name = ContentAnalyzer.replaceAllAttributesInLine(v.asciidoc.attributes, {}, entry[1]).replaceAll("{page-component-version}",v.version.replaceAll(" ","_")).replaceAll("{page-component-version-hyphenated}",v.version.replaceAll(" ","_").replaceAll(".","-"))
                const files = v.files.filter(x => x.src && x.src.path && x.src.path.includes(inputPath.relative))
                if (files.length > 0) {
                    inputPath.module = files[0].src.path.match(/modules\/([^\/]+)\//)[1]
                    inputPath.component = v.name
                    inputPath.version = v.version
                    inputPath.family = inputPath.type+"s"
                }
                v.asciidoc.attributes['page-download-links'].find(x => x[0].includes(entry[1]))[0] = `${name}`
                if (files.length === 1 && [".zip"].includes(files[0].src.extname))  {
                    const f = files[0]
                    const oldName = f.basename
                    const newBasename = name.split("/").at(-1)
                    const newStem = newBasename.replace(/\.[^/.]+$/, "")
                    f.path = f.path.replace(oldName, name)
                    f.src.path = f.path
                    f.basename = newBasename
                    f.src.basename = f.basename
                    f.stem = newStem
                    f.src.stem = f.stem                    
                } else {
                    files.forEach(file => {
                        const relativePath = path.relative(`modules/${inputPath.module}/${inputPath.family}/${inputPath.relative}`,file.src.path)
                        if (relativePath) { zip.addFile(relativePath,file.contents,"") }
                        else { zip.addFile(file.src.basename,file.contents,"") }
                        if (clean) {
                            v.files = v.files.filter(x => x !== file)
                        }
                    })
                    const zipBuffer = zip.toBuffer()
                    const typeFolder = "attachments";
                    const zipFile = new File({ path: `modules/${inputPath.module}/${typeFolder}/${name}`, contents: zipBuffer, src: {}})
                    Object.assign(zipFile.src, { path: zipFile.path, basename: zipFile.basename, stem: zipFile.stem, extname: zipFile.extname, origin: {url: 'generated', startPath: 'generated', refname: 'generated', reftype: 'generated', refhash: 'generated'} })
                    v.files.push(zipFile)
                }
            })
        }
        setCustomAttribute(v)
    })
}

function setCustomAttribute(v) {
    v.asciidoc.attributes['page-component-version-hyphenated'] = v.version.replaceAll(" ","_").replaceAll(".","-")
}

module.exports = {
    generateAttachments
}