module.exports = function (registry) {
    registry.treeProcessor(function () {
      const self = this
      let    verbose = false
      self.process(function (doc) {
        // if (doc.getTitle() && doc.getTitle().includes("Movement modifiers")){verbose = true}
        // Check if sectnums and sectnumoffset is found. Only act if true
        if (verbose){console.log("Title: ",doc.getTitle())}
        if (verbose){console.log("has imageoffset attribute: ",doc.hasAttribute("imageoffset"))}
        if (verbose){console.log("has tableoffset attribute: ",doc.hasAttribute("tableoffset"))}
        if (verbose){console.log("has codeoffset attribute: ",doc.hasAttribute("codeoffset"))}
        if (verbose){console.log("has exampleoffset attribute: ",doc.hasAttribute("exampleoffset"))}
        if (doc.hasAttribute("sectnums") && (doc.hasAttribute("sectnumoffset") || doc.hasAttribute("titleoffset") || doc.hasAttribute("imageoffset") || doc.hasAttribute("tableoffset") || doc.hasAttribute("codeoffset") || doc.hasAttribute("exampleoffset"))) {
            let offsetValue = Math.abs(doc.getAttribute("sectnumoffset",0))
            let pageTitle = doc.getTitle()
            let titleOffset = doc.getAttribute("titleoffset",null)
            let titlePrefix = doc.getAttribute("titleprefix","")
            let imageOffset = Math.abs(doc.getAttribute("imageoffset",0))
            let tableOffset = Math.abs(doc.getAttribute("tableoffset",0))
            let codeOffset = Math.abs(doc.getAttribute("codeoffset",0))
            let exampleOffset = Math.abs(doc.getAttribute("exampleoffset",0))

            if (verbose){console.log("titleoffset attribute: ",titleOffset)}
            if (verbose){console.log("titleprefix attribute: ",titlePrefix)}
            if (verbose){console.log("imageOffset attribute: ",imageOffset)}
            if (verbose){console.log("tableoffset attribute: ",tableOffset)}
            if (verbose){console.log("codeoffset attribute: ",codeOffset)}
            if (verbose){console.log("exampleoffset attribute: ",exampleOffset)}
            // if (verbose){console.log("attributes: ", doc.getAttributes())}

            if (titlePrefix) {
                pageTitle = doc.setTitle(titlePrefix + " " + pageTitle)
            }
            else if (titleOffset) {
                pageTitle = doc.setTitle(titleOffset+" "+pageTitle)
            }
            if (titleOffset) {
                titleOffset = titleOffset.endsWith(".") ? titleOffset : titleOffset+"."
                doc.getSections().filter(s => s.getLevel() === 1).forEach(sect => {
                    offsetValue = 1 + offsetValue
                    sect.setNumeral(titleOffset+offsetValue)
                })
            }
            imageOffset = updateImageOffset(doc, imageOffset, verbose)
            tableOffset = updateTableOffset(doc, tableOffset, verbose)
            codeOffset = updateCodeOffset(doc, codeOffset, verbose)
            exampleOffset = updateExampleOffset(doc, exampleOffset, verbose)
        }
      })
    })


    /**
     * Applies an offset value to a relevant node.
     * @param {*} doc - The node/document to be analyzed. Can be Object or Array.
     * @param {Integer} offset - The offset value that needs to be applied.
     * @param {String} node_name - The expected node_name (table or figure).
     * @param {Boolean} verbose - Optional: States whether verbose output is required.
     * @returns {Integer} The updated offset value.
     */
    function applyOffset (doc, offset, node_name, verbose = false) {
        let newOffset = offset
        // if (verbose && doc.node_name && doc.node_name === "table"){console.log("doc.node_name: ",doc.node_name); console.log("doc.getNodeName()", doc.getNodeName()); console.log("Array.isArray(doc)",Array.isArray(doc)); throw ""}
        // if(verbose && node_name === "listing"){console.log(doc.getNodeName())}
        if (doc.getNodeName && doc.getNodeName() === node_name ) {
            if (verbose) {console.log("found",node_name)}
            newOffset = 1 + newOffset
            const oldNumeral = doc.getNumeral()
            doc.setNumeral(newOffset)
            if(doc.getCaption() && doc.getCaption().replace) {
                // doc.setCaption(`${caption} ${newOffset}. `)
                doc.setCaption(doc.getCaption().replace(oldNumeral,newOffset))
                return newOffset
            }
            return offset
        }
        else if (Array.isArray(doc)) {
            doc.forEach(b => {
                newOffset = applyOffset( b, newOffset, node_name, verbose)
            })
            return newOffset
        }
        else if (doc.getBlocks && Array.isArray(doc.getBlocks())) {
            for (let b of doc.getBlocks()) {
                newOffset = applyOffset( b, newOffset, node_name, verbose)
            }
            return newOffset
        }
        else if(!doc.getBlocks) {
            return offset
        }
        for (let block of doc.getBlocks()) {
            if (!block) {break}
            if(!block.getNodeName) {continue}
            // if (verbose){console.log("block: ",block.getNodeName())}
            if (block.getNodeName() !== node_name && block.hasBlocks()) {
                newOffset = applyOffset( block, newOffset, node_name, verbose)
            }
            else if(block.getNodeName() === node_name) {
                if (verbose) {console.log("found",node_name)}
                newOffset = 1 + newOffset
                const oldNumeral = block.getNumeral()
                block.setNumeral(newOffset)
                if(block.getCaption()) {
                    // block.setCaption(`${caption} ${newOffset}. `)
                    block.setCaption(block.getCaption().replace(oldNumeral,newOffset))
                }
                else {return offset}
            }
        }
        return (newOffset)
    }

    /**
     * Updates and applies the image offset to each image.
     * @param {*} doc - The document.
     * @param {Number} imageOffset - The image offset value.
     * @param {Boolean} verbose - Optional: If true, will print verbose output in the console.
     * @returns {Number} The updated imageOffset.
     */
    function updateImageOffset( doc, imageOffset, verbose=false ) {
        return (applyOffset(doc, imageOffset,"image", verbose))
    }

    /**
     * Updates and applies the table offset to each table.
     * @param {*} doc - The document.
     * @param {Number} tableOffset - The table offset value.
     * @param {Boolean} verbose - Optional: If true, will print verbose output in the console.
     * @returns {Number} The updated tableOffset.
     */
    function updateTableOffset( doc, tableOffset, verbose=false) {
        return (applyOffset(doc, tableOffset,"table", verbose))
    }

    /**
     * Updates and applies the code offset to each code block.
     * @param {*} doc - The document.
     * @param {Number} codeOffset - The code offset value.
     * @param {Boolean} verbose - Optional: If true, will print verbose output in the console.
     * @returns {Number} The updated tableOffset.
     */
    function updateCodeOffset( doc, codeOffset, verbose=false) {
        return (applyOffset(doc, codeOffset, "listing", verbose))
    }

    /**
     * Updates and applies the example offset to each example block.
     * @param {*} doc - The document.
     * @param {Number} exampleOffset - The example offset value.
     * @param {Boolean} verbose - Optional: If true, will print verbose output in the console.
     * @returns {Number} The updated tableOffset.
     */
     function updateExampleOffset( doc, exampleOffset, verbose=false) {
        return (applyOffset(doc, exampleOffset, "example", verbose))
    }
  }
