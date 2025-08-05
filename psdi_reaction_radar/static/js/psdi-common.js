// This file provides common functions related to the PSDI common assets. Most of these are run automatically as
// appropriate, except the first batch of functions exported below. These are exposed to the user so that they can
// customise aspects of the common HTML header

const ORIG_TITLE = "$REPLACEME_SITE_TITLE"
const ORIG_TITLE_LINK = "./"

const DEFAULT_TITLE = "";
const DEFAULT_TITLE_LINK_TARGET = "./";
const DEFAULT_HEADER_LINKS_SOURCE = "./header-links.html";
const DEFAULT_HEADER_SOURCE = "./psdi-common-header.html";
const DEFAULT_FOOTER_SOURCE = "./psdi-common-footer.html";

let title = DEFAULT_TITLE;
let useDefaultTitle = true;
let titleLinkTarget = DEFAULT_TITLE_LINK_TARGET;
let useDefaultTitleLink = true;
let headerLinksSource = DEFAULT_HEADER_LINKS_SOURCE;
let headerSource = DEFAULT_HEADER_SOURCE
let footerSource = DEFAULT_FOOTER_SOURCE

export function setTitle(s) {
  // Public function for the user to set the site title that will appear in the header, to the right of the PSDI logo
  title = s;
  useDefaultTitle = false;
}

export function setTitleLinkTarget(s) {
  // Public function for the user to set the target that clicking on the site title should link to
  titleLinkTarget = s;
  useDefaultTitleLink = false;
}

// Alias for previous name of `setTitleLinkTarget` to maintain backwards compatibility
export const setBrandLinkTarget = setTitleLinkTarget;

export function setHeaderLinksSource(s) {
  // Public function to set the name of an HTML file containing the links to appear on the right side of the header
  // for a given page
  headerLinksSource = s;
}

export function setHeaderSource(s) {
  // Public function to set the name of the header HTML file to be loaded
  headerSource = s;
}

export function setFooterSource(s) {
  // Public function to set the name of the footer HTML file to be loaded
  footerSource = s;
}

const LIGHT_MODE = "light";
const DARK_MODE = "dark";

// Load color mode from session storage and apply it
let mode = sessionStorage.getItem("mode");
if (!mode) {
  mode = LIGHT_MODE;
}
document.documentElement.setAttribute("data-theme", mode);

function toggleMode() {
  let currentMode = document.documentElement.getAttribute("data-theme");
  let new_mode;

  if (currentMode == DARK_MODE) {
    new_mode = LIGHT_MODE;
  } else {
    new_mode = DARK_MODE;
  }

  document.documentElement.setAttribute("data-theme", new_mode);
  sessionStorage.setItem("mode", new_mode);
}

export function connectModeToggleButton() {
  // Connect the mode toggle function to the button
  const lModeToggleButton = document.querySelectorAll(".color-mode-toggle");
  lModeToggleButton.forEach(function (modeToggleButton) {
    modeToggleButton.addEventListener("click", toggleMode);
  });
}

// Counter for elements that need to be loaded - each we request loading will increment this by 1
let loadSteps = 0;

function finalizeLoad() {
  // Decrement the load steps and check if all steps are finished. If so, remove the cover
  --loadSteps;
  if (loadSteps <= 0) {
    $("#cover").hide();
  }
}

export function addHeaderLinks() {
  // We want to load in the links, but preserve the existing mode toggle button alongside them, so this function
  // handles saving it and re-adding it

  let headerLinksParent = $("#psdi-header .navbar__items--right");
  let modeToggle = $("#psdi-header .color-mode-toggle");

  headerLinksParent.load(headerLinksSource,
    function (_response, status, _xhr) {
      if (status == "error") {
        headerLinksParent[0].textContent = "ERROR: Could not load header links";
      }
      headerLinksParent[0].appendChild(modeToggle[0]);
      connectModeToggleButton();
      finalizeLoad();
    });
}

$(document).ready(function () {

  // Start fading out the cover over one second as a failsafe in case something goes wrong and it never gets removed
  $("#cover").fadeOut(1000);

  // Count the elements we'll need to load first, to avoid prematurely removing the cover
  // We load an element only if it's a pure stub with no children; otherwise we assume it is intended to be used
  // as-is and not overwritten by a load. If it's intended to be used as a fallback for if we can't load, it can be
  // assigned the "fallback" class to load if possible despite something existing

  const headerStub = $("#psdi-header");
  let loadHeader = false;
  if (headerStub.length > 0 && (headerStub[0].childNodes.length == 0 || headerStub[0].classList.contains("fallback"))) {
    loadHeader = true;
    ++loadSteps;
  }

  const footerStub = $("#psdi-footer");
  let loadFooter = false;
  if (footerStub.length > 0 && (footerStub[0].childNodes.length == 0 || footerStub[0].classList.contains("fallback"))) {
    loadFooter = true;
    ++loadSteps;
  }

  // Load only if the header stub has no children
  if (loadHeader) {
    $("#psdi-header").load(headerSource,
      function (_response, status, _xhr) {
        if (status != "error") {
          // Check if we should replace the title link by if a value is set, or if the value in the header matches
          // the original value in the source
          let titleLinkElement = $("#psdi-header a.navbar__title")[0];
          if (!useDefaultTitleLink || String(titleLinkElement.href) == ORIG_TITLE_LINK)
            titleLinkElement.href = titleLinkTarget;

          // Check if we should replace the title by if a value is set, or if the value in the header matches
          // the original value in the source
          let titleElement = $("#psdi-header .navbar__title h5")[0];
          if (!useDefaultTitle || String(titleElement.textContent) == ORIG_TITLE)
            titleElement.textContent = title;
          addHeaderLinks();
        } else {
          $("#psdi-header")[0].textContent = "ERROR: Could not load page header";
          connectModeToggleButton();
          finalizeLoad();
        }
      });
  } else {
    connectModeToggleButton();
  }

  // Load only if the footer stub has no children
  if (loadFooter) {
    $("#psdi-footer").load(footerSource,
      function (_response, status, _xhr) {
        if (status == "error") {
          $("#psdi-footer")[0].textContent = "ERROR: Could not load page footer";
        }
        finalizeLoad();
      });
  }

  if (loadSteps == 0)
    finalizeLoad();

});
