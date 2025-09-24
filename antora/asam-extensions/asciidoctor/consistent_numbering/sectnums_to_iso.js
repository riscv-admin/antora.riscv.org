
module.exports = function (registry) {
    registry.postprocessor(function () {
      var self = this
      self.process(function (doc, output) {
        const reSectionTitleList = /<h\d.*>((.*\.\s)[^<]+)<\/h\d>/gm;
        const reSectionTitle = /<h\d.*>((.*\.\s)[^<]+)<\/h\d>/;
        const sectionTitles = output.match(reSectionTitleList);
        if(sectionTitles) {
            for (let id in sectionTitles) {
                let result = sectionTitles[id].match(reSectionTitle)
                const newSectionTitle = sectionTitles[id].replace(result[2],result[2].slice(0,-2)+" ")
                output = output.replace(sectionTitles[id],newSectionTitle)
            }
        }
        return(output)
      })
    })
  }