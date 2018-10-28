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

    // generate the children and then the navEl
    return createChildren(navChildren, classesArr, depth, function(childEls) {
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
    })
  }

  /**
   *
   * @param {object} navChildren
   * @param {Array} classesArr
   * @param {number} depth
   */
  var createChildren = function(navChildren, classesArr, depth, createNavEl) {
    var childEls = navChildren.map(function(item) {
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
    return createNavEl(childEls)
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
    var itemElBefore = createEl('li', 'item', classesArr, depth, isParent)
    var itemEl = addAttributes(itemElBefore, null, null, null, width)
    // now we create the child span or a:
    var childElBefore = createEl(href ? 'a' : 'span', 'link', classesArr, depth, isParent)
    var childEl = addAttributes(childElBefore, title || href, subClassesArr, href)
    itemEl.appendChild(childEl)
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
    var headerTitle = createEl('a', 'header-title', classesArr, depth)
    header.appendChild(addAttributes(headerTitle, title, null, href))
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
   */
  var createEl = function(tag, name, classesArr, depth, isParent) {
    var element = document.createElement(tag)
    classesArr.forEach(function(className) {
      var classNameThenItemName = name ? className + '__' + name : className
      element.classList.add(classNameThenItemName)
      element.classList.add(classNameThenItemName + '--depth-' + depth)
      isParent && element.classList.add(classNameThenItemName + '--parent')
    })
    return element
  }

  /**
   * @param {nodeElement} element
   * @param {string} text - Text or HTML to add inside the element
   * @param {array} subClassesArr - Additional classes to add as-is
   * @param {string} href - The link if necessary
   * @param {number} width -
   */
  var addAttributes = function(element, text, subClassesArr, href, width) {
    if (subClassesArr && subClassesArr.length > 0) {
      subClassesArr.forEach(function(className) {
        element.classList.add(className)
      })
    }
    if (href) element.setAttribute('href', href)
    if (text) element.textContent = text
    if (width) element.style.width = width
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

if (typeof module !== 'undefined') {
  module.exports = {
    create: createMenu
  }
}
