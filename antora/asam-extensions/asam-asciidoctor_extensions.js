//-------------
// This extension collects all other extensions with an anonymous function.
// To add more custom extensions, add them as "require" on top and then call their "register" function in the modules.exports part below.
//-------------
//-------------
// Import modules here
//-------------
const iso = require('./asciidoctor/consistent_numbering/sectnums_to_iso.js');
const off = require('./asciidoctor/consistent_numbering/sectnumsoffset_antora.js');
//-------------
// Export every module's anonymous function within one wrapper function
//-------------
module.exports = function (registry) {
    iso(registry);
    off(registry);
}