/**
 * @file This file contains convenience functions for working the the Dirty Forms JQuery plugin, which keeps track if form
 * data has been modified, and warns the user before leaving the page if this is the case
 * @date 2025-02-14
 * @author Bryan Gillis
 */

/**
 * Initializes dirty forms checking for the current page
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 * @param {string} message The message to be displayed to the user, asking if they're okay proceeding (note that this
 *                         doesn't work on all browsers)
 */
export function initDirtyForms(selector = "form", message = null) {

  $(selector).dirtyForms();
  if (message !== null)
    $.DirtyForms.message = message;
}

/**
 * Sets the current state of the page as "clean" with respect to dirty forms checking
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 */
export function cleanDirtyForms(selector = "form") {
  $(selector).dirtyForms('setClean');
}

/**
 * Sets the current state of the page as "dirty" with respect to dirty forms checking
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 */
export function dirtyDirtyForms(selector = "form") {
  $(selector).dirtyForms('setDirty');
}

/**
 * Enable dirty forms for the page if previously disabled
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 */
export function enableDirtyForms(selector = "form") {
  $(selector).removeClass($.DirtyForms.ignoreClass);
}

/**
 * Disable dirty forms for the page
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 */
export function disableDirtyForms(selector = "form") {
  $(selector).addClass($.DirtyForms.ignoreClass);
}

/**
 * Check if the forms on page are currently dirty or not
 * @param {string} selector CSS selector for the elements to apply this to, default "form"
 * @returns {boolean}
 */
export function checkIsDirty(selector = "form") {
  return $(selector).dirtyForms('isDirty');
}