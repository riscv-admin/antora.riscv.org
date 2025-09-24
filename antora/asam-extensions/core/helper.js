'use strict'
//-------------
//-------------
// Core module with general purpose helper functions.
//
//-------------
//-------------
// Author: Philip Windecker
//-------------
//-------------

/**
 * Capitalizes the first letter of a string.
 * @param {String} string - The input string.
 * @returns {String} The updated string.
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

module.exports = {
    capitalizeFirstLetter
}