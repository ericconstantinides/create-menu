/* global module */
'use strict'

var DESKTOP_BREAKPOINT = 800

var initialize = function () {
  var siteHeader = document.getElementById('site-header')
  var menuTimeout = null
  var inHeader = false

  if (!siteHeader || siteHeader.getElementsByClassName('main-nav').length === 0) {
    return
  }

  /**
   * updateNavActive adds or removes 'is-active' from the 'nav__item' and its 'nav' child
   * @param {node object} target
   * @param {string} action ['add' or 'remove']
   */
  var updateNavActive = function (target, action) {
    if (target.children.length === 0) { return null }
    target.classList[action]('is-active')
    ;[].filter
      .call(target.children, function (child) {
        if (child.classList.contains('main-nav--depth-1')) {
          activeItem = action === 'add' ? child : null
        }
        return child.classList.contains('main-nav')
      })[0]
      .classList[action]('is-active')

    // operate on the shadowMenu:
    if (target.classList.contains('main-nav__item--depth-0')) {
      clearTimeout(isMenuActiveTimeout)
      isMenuActiveTimeout = setTimeout(() => {
        if (action === 'add') {
          if (!isMenuActive) {
            // menu activated
            isMenuActive = true
            shadowMenu.classList.add('is-active')
            shadowMenu.style.height = activeItem && activeItem.clientHeight + 'px'
          } else {
            // menu item changing
            shadowMenu.style.height = activeItem && activeItem.clientHeight + 'px'
          }
        } else if (action === 'remove' && isMenuActive) {
          // menu deactivated
          isMenuActive = false
          shadowMenu.classList.remove('is-active')
        }
      }, 1)
    }
  }

  var delayedUpdateNavActive = function (target, action) {
    if (action === 'add') {
      if (inHeader) {
        updateNavActive(target, action)
      } else {
        menuTimeout = setTimeout(function () {
          updateNavActive(target, action)
          inHeader = true
        }, 150)
      }
    } else if (action === 'remove') {
      clearTimeout(menuTimeout)
      updateNavActive(target, action)
    }
  }

  var handleNavClick = function (event) {
    var target
    var action
    // if DESKTOP (no touch and at least DESKTOP_BREAKPOINT), EXIT
    if (!hasTouch && window.matchMedia('(min-width: ' + DESKTOP_BREAKPOINT + 'px)').matches) {
      return
    }
    // handleParentClick:
    if (event.target.className.indexOf('parent') !== -1) {
      target = event.target.tagName === 'A' ? event.target.parentNode : event.target
      action = target.className.indexOf('is-active') !== -1 ? 'remove' : 'add'
      updateNavActive(target, action)
      event.preventDefault()
      return
    }
    // handleCloseItemClick
    if (event.target.className.indexOf('main-nav__header-close') !== -1) {
      target = event.target
      // go up the chain to its nav__item
      while (target.className.indexOf('main-nav__item') === -1) {
        target = target.parentNode
      }
      updateNavActive(target, 'remove')
      event.preventDefault()
    }
  }

  var handleHeaderMouseLeave = function (event) {
    inHeader = false
  }

  var handleMouseEvent = function (action) {
    return function (event) {
      // MouseEvents are only at DESKTOP_BREAKPOINT or wider:
      if (window.matchMedia('(min-width: ' + DESKTOP_BREAKPOINT + 'px)').matches) {
        delayedUpdateNavActive(event.target, action)
      }
    }
  }

  var handleNavToggle = function (event) {
    var navActive = navToggle.className.indexOf('is-active') !== -1
    var action = navActive ? 'remove' : 'add'
    // toggle all the extra items:
    navToggle.classList[action]('is-active')
    siteHeader.classList[action]('is-active')
    if (navActive) {
      ;[].forEach.call(allNavs, function (el) {
        el.classList.remove('is-active')
      })
      ;[].forEach.call(parentItems, function (el) {
        el.classList.remove('is-active')
      })
    } else {
      // activate the nav:
      mainNav.classList.add('is-active')
    }
    // prevents the page from moving while the nav menu is open (doesn't work entirely for iOS):
    document.body.classList[navActive ? 'remove' : 'add']('menu-is-active')
    document.body.style.overflow = navActive ? 'inherit' : 'hidden'
    HTML.style.overflow = navActive ? 'inherit' : 'hidden'
  }

  var handleWindowResizing = function () {
    // only write to the DOM once if isResizing isn't true yet; check windowWidth change for mobile saying resize:
    if (isResizing === false && windowWidth !== window.innerWidth) {
      HTML.classList.add('is-resizing')
      isResizing = true
      windowWidth = window.innerWidth
    }
    clearTimeout(isResizingTimeout)
    isResizingTimeout = setTimeout(function () {
      HTML.classList.remove('is-resizing')
      isResizing = false
      windowWidth = window.innerWidth
    }, 250)
  }
  // shadowMenu gives us nice transitions for the menu backdrop
  var addShadowMenu = function (mainNav) {
    var shadowMenu = document.createElement('div')
    shadowMenu.classList.add('main-nav--shadow-menu')
    mainNav.appendChild(shadowMenu)
    return shadowMenu
  }

  var HTML = document.documentElement
  var navToggle = siteHeader.getElementsByClassName('main-nav__toggle')[0]
  var mainNav = siteHeader.getElementsByClassName('main-nav--depth-0')[0]
  var allNavs = siteHeader.getElementsByClassName('main-nav')
  var parentItems = siteHeader.getElementsByClassName('main-nav__item--parent')
  var isResizing = false
  var windowWidth = window.innerWidth
  var isResizingTimeout

  var isMenuActive = false
  var isMenuActiveTimeout

  var activeItem = null

  var hasTouch = !!(
    'ontouchstart' in window ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
  // add the touch class to html element for CSS styling:
  HTML.classList.add(hasTouch ? 'has-touch' : 'no-touch')

  // add the shadow-menu-bg
  var shadowMenu = addShadowMenu(mainNav)

  // Event Listeners:
  window.addEventListener('resize', handleWindowResizing)
  navToggle.addEventListener('click', handleNavToggle)
  mainNav.addEventListener('click', handleNavClick)
  siteHeader.addEventListener('mouseleave', handleHeaderMouseLeave)
  ;[].forEach.call(parentItems, function (parentItem) {
    // mouseenter is ONLY for "DESKTOP":
    if (!hasTouch) {
      parentItem.addEventListener('mouseenter', handleMouseEvent('add'))
    }
    // mouseleave is for EVERYBODY
    parentItem.addEventListener('mouseleave', handleMouseEvent('remove'))
  })
}

document.addEventListener('DOMContentLoaded', initialize, false)

if (typeof module !== 'undefined') {
  module.exports = {
    initialize: initialize
  }
}
