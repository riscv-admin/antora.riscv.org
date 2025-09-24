//-------------
// This extension collects all other extensions with a register function.
// To add more custom extensions, add them as "require" on top and then call their "register" function in the modules.exports.require part below.
//-------------
//-------------
// Import modules here
//-------------
const tabs = require('./asciidoctor/tabs-block/extension.js');
//-------------
// Export every module's register function within one wrapper register function
//-------------
module.exports.register = (registry, context) => {
    tabs.register(registry,context)
}