// Regular expressions
const macrosRegEx = new Array(
    { macro: "role", re: /^\s*role_related::(.*)\[(.*)\]\n?/ },
    { macro: "related", re: /^\s*related::(.*)\[(.*)\]\n?/ },
    { macro: "reference", re: /^\s*reference::(.*)\[(.*)\]\n?/ },
    { macro: "pages", re: /^\s*pages::([\[]*)\[(.*)\]\n?/ },
    { macro: "autonav", re: /^\s*\/\/\s*autonav::(.*)\[(.*)\]\n?/g }
)


// Section headings and macros
const macrosHeadings = new Array(
    { macro: "role", heading: "== Role-related topics\n\n" },
    { macro: "related", heading: "== Related topics\n\n" },
    { macro: "reference", heading: "" },
    { macro: "pages", heading: "== Pages\n:pagesmacro:\n\n" },
    { macro: "autonav", heading: "" }
)



module.exports = {
    macrosRegEx,
    macrosHeadings
}