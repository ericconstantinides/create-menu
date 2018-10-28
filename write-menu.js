/**
 *
 * @param {Object} options - a group of options for writing the created menu
 * @param {string} options.wrapper - html containing a "stub" which gets replaced by the menu
 * @param {object} options.json - the data of the menu to be created
 * @param {string} options.stub - token, like "<!-- MENU_STUB -->" which gets replaced by the menu
 * @param {string} options.saveToPath - the folder to save the file
 * @param {string} options.saveToFile - the filename to save
 */
var write = function(options) {
  var getWrapper = function() {
    // write the menu html:
    request(options.wrapper, function(err, resp, body) {
      if (err) throw err
      var siteHeader = body.toString()
      generateMenu(siteHeader)
    })
  }
  var generateMenu = function(siteHeader) {
    request(options.json, function(err, resp, body) {
      if (err) throw err
      const menu = createMenu(JSON.parse(body.toString()), siteHeader, options.stub)
      fs.writeFile(options.saveToPath + '/' + options.saveToFile, menu, function(err) {
        if (err) throw err
      })
    })
  }
  var copyFile = function(file, fileName, updateFn) {
    request(file, function(err, resp, body) {
      if (err) throw err
      var udpatedBody = updateFn ? updateFn(body) : body
      fs.writeFile(options.saveToPath + '/' + fileName, udpatedBody, function(err) {
        if (err) throw err
      })
    })
  }
  var updateCss = function(imagesPath) {
    return function(cssData) {
      return imagesPath ? cssData.replace(/\/images\//g, imagesPath) : cssData
    }
  }
  // this only works in Node
  if (typeof window !== 'undefined') return null

  if (options.wrapper) {
    getWrapper()
  } else {
    generateMenu('')
  }
  copyFile(options.js, 'site-header.js')
  copyFile(options.css, 'site-header.css', updateCss(options.imagesPath))
}

if (typeof module !== 'undefined') {
  module.exports = {
    writeMenu: write
  }
}
