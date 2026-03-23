/**
 * @file Functions etc. necessary to allow user input of formatted labels and drawing them on a plot
 * @date 2025-10-31
 * @author Bryan Gillis
 */

// Constants

const FULL_CLASS = "ql-full";

const QUILL_THEME = "snow";

const MATHJAX_DEFAULT_FONT_SIZE = 16;
const MATHJAX_BASE_FONT_SCALING = 1.125;

const T_WAIT = 100;
const MAX_ELAPSED = 500;

// Non-constant globals

let compatibilityMode = "unknown";
let currentRenderBatch = 0;
let numAwaitingRender = 0;

const dQuillEditors = {};

/**
 * Initialise a Quill editor
 * @param {String} selector 
 * @param {String} placeholder 
 */
export function addQuillEditor(selector, placeholder = "") {

  // Check that the selector is an ID
  if (!selector.startsWith("#") || selector.includes(" ") || selector.includes(".")) {
    console.error(`Selector "${selector}" is invalid for initialising a Quill editor. The selector must only be an ` +
      `ID in the format "#editor-ID"`);
    return;
  }

  // Determine some options from the element's attributes
  const el = $(selector);
  const full = el.hasClass(FULL_CLASS);
  if (!placeholder && el.attr("placeholder")) {
    // Clean any whitespace in the placeholder text to be single spaces, since this may have linebreaks in it to avoid
    // long lines in the HTML
    placeholder = el.attr("placeholder").replaceAll(/\s+/gmu, " ");
  }

  // Add a toolbar before this element if one doesn't already exist, and a symbol palette before that
  const prevEl = el.prev();
  let toolbar, symbolPalette;
  if (prevEl.length == 0 || !prevEl.hasClass("ql-toolbar")) {

    const newToolbar = $($("#quill-toolbar")[0].content.children[0].cloneNode(true));
    el.before(newToolbar);

    const newSymbolPalette = $($("#symbol-palette")[0].content.children[0].cloneNode(true));
    newToolbar.before(newSymbolPalette);

    toolbar = newToolbar;
    symbolPalette = newSymbolPalette;
  } else {
    // A toolbar already exists, so disconnect any events for it and the symbol palette so we don't duplicate them
    toolbar = prevEl;
    symbolPalette = toolbar.prev();
    toolbar.find(".insert-symbol").off("click");
    symbolPalette.find("button").off("click");
  }

  // Connect an event to the symbol button on the toolbar to toggle the visibility of the symbol palette
  toolbar.find(".insert-symbol").on("click", toggleSymbolPalette);

  // And connect events to all buttons in the symbol palette to insert their respective symbols
  symbolPalette.find("button").on("click", insertSymbol);

  // Disable Quill's tab binding so the user can tab out of Quill's input boxes
  let bindings = {
    tab: {
      key: [9, "tab", "Tab"],
      handler: () => {
        // We need to return true to restore default tab behaviour
        return true;
      }
    }
  };

  // In the simple editor, we disable default bindings for enter to prevent newline inputs
  if (!full) {
    bindings.enter = {
      key: [13, "enter", "Enter"],
      handler: () => {
        // Need to return false here so we don't insert a newline
        return false;
      }
    };
    bindings["shift enter"] = {
      key: [13, "enter", "Enter"],
      shiftKey: true,
      handler: () => {
        // Need to return false here so we don't insert a newline
        return false;
      }
    };
  }

  const editor = new Quill(selector, {
    modules: {
      keyboard: {
        bindings: bindings
      },
      toolbar: `.ql-toolbar:has(+${selector})`
    },
    placeholder: placeholder,
    theme: QUILL_THEME
  });

  dQuillEditors[selector] = editor;

  // Show the toolbar only if the editor is active
  editor.on("selection-change", (range) => {
    if (range)
      enableQuillToolbar(selector);
    else
      disableQuillToolbar(selector);
  });
}

export function getQuillEditor(selector) {
  return dQuillEditors[selector];
}

export function setQuillEditor(selector, editor) {
  dQuillEditors[selector] = editor;
}

/**
 * Gets the HTML content of a Quill text editor, by default cleaning it of tags that aren't used for formatted labels
 * @param {String} selector The selector used as a key for the editor
 * @param {Boolean} clean If true (default), will strip any HTML tags that aren't used for making formatted labels
 * @returns {String}
 */
export function getQuillEditorHTML(selector, clean = true) {
  const editor = getQuillEditor(selector);
  if (!editor)
    return "";

  const editorHTML = editor.getSemanticHTML();
  if (clean)
    return cleanTags(editorHTML);
  else
    return editorHTML

}

export function removeQuillEditor(selector) {
  delete dQuillEditors[selector];
}

export function updateQuillContents(selector, contents) {
  $(selector + " .ql-editor p").html(contents);
  dQuillEditors[selector].updateContents();
}

export function enableQuillToolbar(selector) {
  $(selector).parent().find(".ql-toolbar").addClass("visible");
}

export function disableQuillToolbar(selector) {
  const toolbar = $(selector).parent().find(".ql-toolbar");
  toolbar.removeClass("visible");

  // Also make sure to disable the symbol palette whenever the toolbar is disabled
  disableSymbolPalette(selector);
  toolbar.find(".insert-symbol").removeClass("ql-active");
}

function disableSymbolPalette(selector) {
  const parent = $(selector).parent();
  parent.find(".insert-symbol").removeClass("ql-active");
  parent.find(".symbol-palette").removeClass("visible");
}

function toggleSymbolPalette(e) {

  const openPaletteButton = $(e.delegateTarget);
  const symbolPalette = openPaletteButton.parents(":has(>.ql-toolbar)").find(".symbol-palette");

  if (symbolPalette.hasClass("visible")) {
    openPaletteButton.removeClass("ql-active");
    symbolPalette.removeClass("visible");
  }
  else {
    openPaletteButton.addClass("ql-active");
    symbolPalette.addClass("visible");
  }
}

/**
 * Called by a button press from the symbol palette to insert a symbol in the associated quill editor
 * @param {Event} e 
 */
function insertSymbol(e) {
  const symbolButton = $(e.delegateTarget);

  // Get the symbol we want to insert
  const symbol = symbolButton.find(".button-text").text();

  // Get the quill editor we'll be inserting it into
  const selector = "#" + symbolButton.parents(":has(>.ql-container)").find(".ql-container").attr("id");
  const quill = getQuillEditor(selector);

  // Find where in the editor we want to insert it. If a selection, delete the contents first. If no selection or
  // cursor in the input, insert the symbol at the end
  let index = quill.getLength() - 1;
  const range = quill.getSelection();
  if (range) {
    index = range.index;
    if (range.length > 0)
      quill.deleteText(index, range.length, "user");
  }
  quill.insertText(index, symbol, "user");

  // Set the selection after the inserted symbol
  quill.setSelection(index + 1);
}

export function enableQuillEvents(alwaysCallback, otherCallbacks) {
  // Set all editors to toggle toolbars when selected and auto-update the plot on change
  Object.entries(dQuillEditors).forEach((entry) => {
    const [selector, editor] = entry;

    editor.off("selection-change");
    editor.on("selection-change", (range) => {
      if (range)
        enableQuillToolbar(selector);
      else
        disableQuillToolbar(selector);
    });

    editor.off("text-change");
    if (!selector.includes("rocrate"))
      editor.on("text-change", alwaysCallback);

  });

  // Set up all other applicable callbacks for when an editor's text is changed
  Object.entries(otherCallbacks).forEach(([selector, callback]) => {
    dQuillEditors[selector].on("text-change", callback);
  });
}

/**
 * MathJax is loaded asynchronously, so early calls to generate the plot may not have it. This waits to ensure it's
 * available
 */
export async function waitForMathJax() {
  return new Promise(resolve => {

    let interval;
    let elapsed = 0;

    const checkForMathJax = function () {
      elapsed += T_WAIT;
      if (MathJax.tex2svg || elapsed >= MAX_ELAPSED) {
        clearInterval(interval);
        resolve();
      }
    };

    interval = setInterval(checkForMathJax, T_WAIT);
  });
}

/**
 * Cleans up an HTML string to replace non-breaking spaces with regular spaces and remove any tags and data we aren't
 * doing anything with.
 * @param {string} s 
 * @returns {string}
 */
export function cleanTags(s) {
  return s.replaceAll("&nbsp;", " ")
    .replaceAll("<p>", "").replaceAll("</p>", "")
    .replaceAll("<br>", "")
    .replaceAll(/<span\b[^>]*>/gmu, "").replaceAll("</span>", "")
    .replaceAll(/<([a-zA-Z]+)\b[^>]*>/gmu, "<$1>");
}

/**
 * Removes all relevant HTML tags from a string, including those that are used in other parts of the code for formatting
 * @param {String} s 
 * @returns {String}
 */
export function stripTags(s) {
  return cleanTags(s).replaceAll(/<\/?em>/g, "")
    .replaceAll(/<\/?strong>/g, "")
    .replaceAll(/<\/?u>/g, "")
    .replaceAll(/<\/?sup>/g, "")
    .replaceAll(/<\/?sub>/g, "");
}

/**
 * Remove any tags which enclose the whole string without interruption, e.g.:
 *   <em>A</em> -> A
 *   <em>A</em> B -> <em>A</em> B
 *   <em>A</em> B <em>C</em> -> <em>A</em> B <em>C</em>
 * @param {String} s 
 * @returns {String}
 */
export function removeGlobalTags(s) {

  const tagRegex = /^<(\w+)>(.*?)<\/\1>/u;

  let haveMatch = true;
  while (haveMatch) {
    let match = s.match(tagRegex);

    if (s && match && match[0] == s)
      s = match[2];
    else
      haveMatch = false;
  }

  return s;
}

export function incrementRenderBatch() {
  return ++currentRenderBatch;
}

export async function drawFormatted(ctx, labelHTML, x, y, fontSize, hAlign, renderBatch) {
  if (labelHTML == "")
    return;
  ++numAwaitingRender;

  const adaptor = MathJax.startup.adaptor;
  const mathJaxSVG = await MathJax.tex2svgPromise(HTMLToTex(labelHTML));
  let svgHTML = adaptor.tags(mathJaxSVG, 'svg')[0].outerHTML;

  // MathJax SVGs use &lt; and &gt; within their tags. Normally this is fine, but in older versions of Safari the above
  // command will convert them to < and >, which causes problems. We use a Regex to find and correct these instances.

  // The regex is complicated to search for, so we save some time by checking if this is necessary the first time this
  // comes up, and skipping afterwards if it isn't
  const doubleTagRegex = /(<[^>]+?)<([^>]+?)>([^>]+?>)/g;
  if (compatibilityMode == "unknown") {
    if (svgHTML.search(doubleTagRegex) > 0)
      compatibilityMode = true;
    else
      compatibilityMode = false;
  }

  if (compatibilityMode) {
    // Since there may be multiple tags within each set of enclosing tags, we run this in a while loop until all have been
    // found
    let noChange = false;
    let lastSvgHTML = svgHTML;
    while (!noChange) {
      svgHTML = svgHTML.replaceAll(doubleTagRegex, "$1&lt;$2&gt;$3");
      if (svgHTML == lastSvgHTML)
        noChange = true;
      else
        lastSvgHTML = svgHTML;
    }
  }

  // Strip unneeded information from the svg source to speed loading
  svgHTML = svgHTML.replaceAll(/ data-\S*?=".*?"/g, "");

  let DOMURL = window.URL || window.webkitURL || window;
  let img1 = new Image();
  img1.svgHTML = svgHTML;
  let svg = new Blob([svgHTML], { type: 'image/svg+xml' });
  let url = DOMURL.createObjectURL(svg);
  img1.scale = MATHJAX_BASE_FONT_SCALING * fontSize / MATHJAX_DEFAULT_FONT_SIZE;

  // Keep track of the render batch where this was triggered, and only draw it if it's loaded in the same batch
  img1.renderBatch = renderBatch;

  img1.onload = function () {
    --numAwaitingRender;
    if (img1.renderBatch == currentRenderBatch) {
      let w = img1.naturalWidth * img1.scale;
      let h = img1.naturalHeight * img1.scale;
      let finalX = x;
      if (hAlign == "center")
        finalX -= w / 2;
      ctx.drawImage(img1, finalX, y, w, h);
    }
    DOMURL.revokeObjectURL(url);
  }
  img1.src = url;
}

/**
 * Convert a string from HTML markup to TeX
 * @param {String} s The string in HTML
 * @returns The string converted to TeX
 */
export function HTMLToTex(s) {
  // Escape any characters that need to be escaped
  s = s.replaceAll("%", "\\%");

  // Replace spaces with the LaTeX command for a space
  s = s.replaceAll(" ", "\\:");

  // Replace hyphens with non-breaking hyphens so they won't get interpreted as minus symbols by the parser
  s = s.replaceAll("-", "\u2011");

  // Wrap in tags for normal text
  s = "{\\rm " + s + "}";

  // Replace HTML tags with the equivalent TeX markup

  // Check for combined bold/italics sections specially, since we need a different command to handle both at once
  let changed = true;
  while (changed) {
    let old_s = s;
    s = s.replaceAll(/<strong>((?!<\/strong>).*?)<em>(.*?)<\/em>(.*?)<\/strong>/gmu,
      "<strong>$1<\/strong>\\mathbfit{$2}<strong>$3<\/strong>");
    if (s == old_s)
      changed = false;
  }

  s = s.replaceAll("<em>", "\\textit{").replaceAll("</em>", "}")
    .replaceAll("<strong>", "\\textbf{").replaceAll("</strong>", "}")
    .replaceAll("<u>", "\\underline{").replaceAll("</u>", "}")
    .replaceAll("<sub>", "_{\\rm ").replaceAll("</sub>", "}")
    .replaceAll("<sup>", "^{\\rm ").replaceAll("</sup>", "}");

  return s;
}

/**
 * Convert a string from HTML markup to Markdown
 * @param {String} s The string in HTML
 * @returns The string converted to Markdown
 */
export function HTMLToMd(s) {
  s = s.replaceAll(/<\/?em>/g, "*")
    .replaceAll(/<\/?strong>/g, "**")
    .replaceAll(/<\/?u>/g, "")
    .replaceAll(/<\/?sub>/g, "~")
    .replaceAll(/<\/?sup>/g, "^");

  return s;
}

export async function renderingComplete(max_wait = 10000) {
  return new Promise((resolve, reject) => {

    let interval;
    let elapsed = 0;

    const checkForRenderingComplete = function () {
      elapsed += T_WAIT;
      if (numAwaitingRender == 0) {
        clearInterval(interval);
        resolve();
      } else if (elapsed >= max_wait) {
        clearInterval(interval);
        reject("Maximum wait time exceeded for rendering to complete");
      }
    };

    interval = setInterval(checkForRenderingComplete, T_WAIT);
  });
}