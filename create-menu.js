/* global require, module */

var jsdom = require('jsdom')
var request = require('request')
const fs = require('fs')

// create document based on either window.document or jsdom
if (typeof document === 'undefined') {
  var JSDOM = jsdom.JSDOM
  var dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  var document = dom.window.document
}

var createMenu = function(navObj, siteHeaderHTML, menuStub) {
  /**
   * createMenuRecursive creates each child off of the links object
   *
   * @param {object} navObj
   * @param {integer} depth
   * @param {array} parentClassesArr
   */
  var createMenuRecursive = function(navObj, depth, parentClassesArr) {
    var itemClassesArr = (navObj.className && navObj.className.split(' ')) || []
    var classArr = itemClassesArr.concat(parentClassesArr)
    var navEl = createEl('nav', depth, classArr)
    var listContainerEl = createEl('div', depth, classArr, 'list-container')
    navEl.appendChild(listContainerEl)

    var navChildren = navObj.links || []

    // generate the children:
    var childEls = createChildren(navChildren, depth, classArr)

    var numOfColumns = navObj.columns ? navObj.columns : 1
    var columns = []
    for (var j = 0; j < numOfColumns; j++) {
      columns[j] = createEl('ul', depth, classArr, 'list')
      listContainerEl.appendChild(columns[j])
    }
    var currentCol = 0
    if (columns.length > 0) {
      for (var i = 0; i < childEls.length; i++) {
        // figure out which column:
        currentCol = Math.floor(i / Math.ceil(childEls.length / numOfColumns))
        columns[currentCol].appendChild(childEls[i])
      }
    }
    return navEl
  }

  /**
   *
   * @param {object} navChildren
   * @param {integer} depth
   * @param {Array} classArr
   */
  var createChildren = function(navChildren, depth, classArr) {
    return navChildren.map(function(item) {
      var subClassArr = (item.className && item.className.split(' ')) || []
      var hasChildren = item.links && item.links.length > 0
      var itemEl = createItem(item, depth, classArr, hasChildren, subClassArr)
      if (hasChildren) {
        var childNavEl = createMenuRecursive(item, depth + 1, classArr)
        if (depth === 0) {
          childNavEl.appendChild(createHeader(item, depth + 1, classArr))
        }
        itemEl.insertBefore(childNavEl, itemEl.firstChild.nextSibling)
      }
      return itemEl
    })
  }

  /**
   *
   * @param {object} item
   * @param {integer} depth
   * @param {array} classArr
   * @param {boolean} isParent
   * @param {array} subClassArr
   */
  var createItem = function(item, depth, classArr, isParent, subClassArr) {
    var title = item.title
    var href = item.href
    var width = item.width
    var itemEl = createEl('li', depth, classArr, 'item', isParent, null, null, null, width)
    itemEl.appendChild(
      title && href
        ? createEl('a', depth, classArr, 'link', isParent, title, subClassArr, href)
        : createEl('span', depth, classArr, 'title', isParent, title || href, subClassArr)
    )
    return itemEl
  }

  /**
   *
   * @param {object} item
   * @param {integer} depth
   * @param {array} classArr
   */
  var createHeader = function(item, depth, classArr) {
    var title = item.title
    var href = item.href
    var header = createEl('header', depth, classArr, 'header')
    header.appendChild(createEl('a', depth, classArr, 'header-title', null, title, null, href))
    header.appendChild(createEl('span', depth, classArr, 'header-close'))
    return header
  }

  /**
   *
   * @param {string} tag The tag of HTML element to make
   * @param {integer} depth
   * @param {array} classArr
   * @param {string} name The classname to add to the element
   * @param {boolean} isParent
   * @param {string} text Text or HTML to add inside the element
   * @param {array} subClassArr Additional classes to add as-is
   * @param {string} href The link if necessary
   * @param {number} width
   */
  var createEl = function(
    tag,
    depth,
    classArr,
    name,
    isParent,
    text,
    subClassArr,
    href,
    width
  ) {
    var element = document.createElement(tag)
    classArr.forEach(function(className) {
      var classNameThenItemName = name ? className + '__' + name : className
      element.classList.add(classNameThenItemName)
      element.classList.add(classNameThenItemName + '--depth-' + depth)
      isParent && element.classList.add(classNameThenItemName + '--parent')
    })
    subClassArr &&
      subClassArr.forEach(function(className) {
        return element.classList.add(className)
      })
    href && element.setAttribute('href', href)
    element.textContent = text || ''
    if (width) {
      element.style.width = width
    }
    return element
  }

  var menuClassName = navObj.className ? navObj.className : ''
  var menuClassesArr = (menuClassName && menuClassName.split(' ')) || []
  var navEl = createMenuRecursive(navObj, 0, menuClassesArr)

  if (siteHeaderHTML && menuStub) {
    return siteHeaderHTML.replace(menuStub, navEl.outerHTML)
  }
  return navEl.outerHTML
}

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
    create: createMenu,
    write: write
  }
}
