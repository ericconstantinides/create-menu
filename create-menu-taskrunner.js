/* global require */
const fs = require('fs')
const createMenu = require('./create-menu')
// const menuJSON = require('./example/insureon-menu.json')
const menuJSON = require('./example/example-menu.json')
// const menuWrapper = require('./example/example-index.html')

let blankSiteHeader
fs.readFile('./example/example-index.html', function(err, data) {
  // fs.readFile('./static/site-header.html', function(err, data) {
  if (err) throw err
  blankSiteHeader = data.toString()
  const menu = createMenu.create(menuJSON, blankSiteHeader, '<!-- MENU_STUB -->')
  console.log(menu)
})
// console.log(blankSiteHeader)

// const options = {
//   wrapper: './example/example-index.html',
//   json: './example/example-menu.json',
//   stub: '<!-- MENU_STUB -->',
//   saveToPath: './',
//   saveToFile: 'yay-go-eric-index.html'
// }

// createMenu.write(options)
