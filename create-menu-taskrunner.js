/* global require */
const fs = require('fs')
const createMenu = require('./create-menu')
const menuJSON = require('./example/example-menu.json')

let blankSiteHeader
fs.readFile('./example/blank-index.html', function(err, data) {
  if (err) throw err
  blankSiteHeader = data.toString()
  const menu = createMenu.create(menuJSON, blankSiteHeader, '<!-- MENU_STUB -->')
  fs.writeFile('./example/index.html', menu, function(err) {
    if (err) throw err
  })
})
