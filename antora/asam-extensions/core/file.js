'use strict'
//-------------
//-------------
// Core module for changing content on a page.
// This module is from the original Antora project:
// https://gitlab.com/antora/antora
//
//-------------
//-------------
// Author: Dan Allen
//-------------
//-------------
const Vinyl = require('vinyl')

class File extends Vinyl {
  get path () {
    return this.history[this.history.length - 1]
  }

  set path (path_) {
    this.history.push(path_)
  }

  get relative () {
    return this.history[this.history.length - 1]
  }
}

module.exports = File
