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
   * @param {array} parentClassesArr
   * @param {number} depth
   */
  var createMenuRecursive = function(navObj, parentClassesArr, depth) {
    var itemClassesArr = (navObj.className && navObj.className.split(' ')) || []
    var classesArr = itemClassesArr.concat(parentClassesArr)
    var navEl = createEl('nav', null, classesArr, depth)
    var listContainerEl = createEl('div', 'list-container', classesArr, depth)
    navEl.appendChild(listContainerEl)

    var navChildren = navObj.links || []

    // generate the children:
    var childEls = createChildren(navChildren, classesArr, depth)

    var numOfColumns = navObj.columns ? navObj.columns : 1
    var columns = []
    for (var j = 0; j < numOfColumns; j++) {
      columns[j] = createEl('ul', 'list', classesArr, depth)
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
   * @param {Array} classesArr
   * @param {number} depth
   */
  var createChildren = function(navChildren, classesArr, depth) {
    return navChildren.map(function(item) {
      var subClassesArr = (item.className && item.className.split(' ')) || []
      var hasChildren = item.links && item.links.length > 0
      var itemEl = createItem(item, depth, classesArr, hasChildren, subClassesArr)
      if (hasChildren) {
        var childNavEl = createMenuRecursive(item, classesArr, depth + 1)
        if (depth === 0) {
          childNavEl.appendChild(createHeader(item, classesArr, depth + 1))
        }
        itemEl.insertBefore(childNavEl, itemEl.firstChild.nextSibling)
      }
      return itemEl
    })
  }

  /**
   *
   * @param {object} item
   * @param {number} depth
   * @param {array} classesArr
   * @param {boolean} isParent
   * @param {array} subClassesArr
   */
  var createItem = function(item, depth, classesArr, isParent, subClassesArr) {
    var title = item.title
    var href = item.href
    var width = item.width
    var itemEl = createEl('li', 'item', classesArr, depth, isParent, null, null, null, width)
    itemEl.appendChild(
      title && href
        ? createEl('a', 'link', classesArr, depth, isParent, title, subClassesArr, href)
        : createEl('span', 'title', classesArr, depth, isParent, title || href, subClassesArr)
    )
    return itemEl
  }

  /**
   *
   * @param {object} item
   * @param {array} classesArr
   * @param {number} depth
   */
  var createHeader = function(item, classesArr, depth) {
    var title = item.title
    var href = item.href
    var header = createEl('header', 'header', classesArr, depth)
    header.appendChild(createEl('a', 'header-title', classesArr, depth, null, title, null, href))
    header.appendChild(createEl('span', 'header-close', classesArr, depth))
    return header
  }

  /**
   *
   * @param {string} tag - The tag of HTML element to make
   * @param {string} name - The primay classname of the element
   * @param {array} classesArr - 
   * @param {number} depth - how many layers deep into the recursion
   * @param {boolean} isParent -
   * @param {string} text - Text or HTML to add inside the element
   * @param {array} subClassesArr - Additional classes to add as-is
   * @param {string} href - The link if necessary
   * @param {number} width -
   */
  var createEl = function(tag, name, classesArr, depth, isParent, text, subClassesArr, url, width) {
    var element = document.createElement(tag)
    classesArr.forEach(function(className) {
      var classNameThenItemName = name ? className + '__' + name : className
      element.classList.add(classNameThenItemName)
      element.classList.add(classNameThenItemName + '--depth-' + depth)
      isParent && element.classList.add(classNameThenItemName + '--parent')
    })
    if (subClassesArr && subClassesArr.length > 0) {
      subClassesArr.forEach(function(className) {
        element.classList.add(className)
      })
    }
    if (url) {
      element.setAttribute('href', url)
    }
    element.textContent = text || ''
    if (width) {
      element.style.width = width
    }
    return element
  }

  var menuClassName = navObj.className ? navObj.className : ''
  var menuClassesArr = (menuClassName && menuClassName.split(' ')) || []
  var navEl = createMenuRecursive(navObj, menuClassesArr, 0)

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
