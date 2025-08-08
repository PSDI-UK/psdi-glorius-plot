/**
 * @file common.js
 * @date 2025-02-14
 * @author Bryan Gillis
 */

export function initDirtyForms() {
  $("form").dirtyForms();
}

export function cleanDirtyForms() {
  $('form').dirtyForms('setClean');
}

export function dirtyDirtyForms() {
  $('form').dirtyForms('setDirty');
}

export function enableDirtyForms() {
  $('form').removeClass($.DirtyForms.ignoreClass);
}

export function disableDirtyForms() {
  $('form').addClass($.DirtyForms.ignoreClass);
}
