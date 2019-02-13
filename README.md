# CreateMenu

Create Menu creates an HTML menu from a JSON object. It also includes CSS and ES5 compatible JS to operate the menu.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [JSON Structure](#JSON_Structure)

- @param {JSON} navObj a (JSON) object of the nav
- @param {string} optional siteHeaderHTML a string containing the blank site header
- @param {string} optional menuStub a stub to replace in the siteHeaderHTML, ex: `<!-- MENU_STUB -->`

@returns {string} the generated menu HTML

## JSON Structure
See [example/example-menu.json](example/example-menu.json)

## CreateMenuTaskRunner with Node

createMenu can run from the command line with a small taskRunner file. It's executed by running, `node createMenuTaskRunner.js`

## Webpack integration

``` js
/* global require */
const fs = require('fs')
const createMenu = require('createMenu')
const menuJSON = require('./menu.json')

const MENU_STUB = '<!-- MENU_STUB -->'
let blankSiteHeader
fs.readFile('./public/site-header/site-header.html', function (err, data) {
  if (err) throw err
  blankSiteHeader = data.toString()
})

const menu = createMenu.create(menuJSON, blankSiteHeader, MENU_STUB)
console.log(menu)
```

