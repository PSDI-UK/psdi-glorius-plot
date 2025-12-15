/**
 * @file Functions etc. necessary to allow user input of formatted labels and drawing them on a plot
 * @date 2025-10-31
 * @author Bryan Gillis
 */

// Constants

const QUILL_THEME = "snow";
const QUILL_TOOLBAR = ['bold', 'italic', 'underline', { 'script': 'sub' }, { 'script': 'super' }];

const MATHJAX_DEFAULT_FONT_SIZE = 16;
const MATHJAX_BASE_FONT_SCALING = 1.125;

const T_WAIT = 100;
const MAX_ELAPSED = 500;

// Non-constant globals

let compatibilityMode = "unknown";
let currentRenderBatch = 0;

const dQuillEditors = {};

/**
 * Initialise a Quill editor
 */
export function addQuillEditor(selector, placeholder = "", toolbar = QUILL_TOOLBAR) {
  const editor = new Quill(selector, {
    modules: {
      toolbar: toolbar
    },
    placeholder: placeholder,
    theme: QUILL_THEME
  });

  dQuillEditors[selector] = editor;

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

export function getQuillEditorHTML(selector) {
  return getQuillEditor(selector).getSemanticHTML();
}

export function setQuillEditor(selector, editor) {
  dQuillEditors[selector] = editor;
}

export function removeQuillEditor(selector) {
  delete dQuillEditors[selector];
}

export function updateQuillContents(selector, contents) {
  $(selector + " .ql-editor p").html(contents);
  dQuillEditors[selector].updateContents();
}

function enableQuillToolbar(selector) {
  $(selector).parent().find(".ql-toolbar").addClass("visible");
}

function disableQuillToolbar(selector) {
  $(selector).parent().find(".ql-toolbar").removeClass("visible");
}

export function enableQuillEvents(alwaysCallback, outputLabelCallback) {
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
    editor.on("text-change", alwaysCallback);

  });

  // Also set the output label editor to update the output label in column headings when changed
  dQuillEditors["#ol-0"].on("text-change", outputLabelCallback);
}

/**
 * MathJax is loaded asynchronously, so early calls to generate the plot may not have it. This waits to ensure it's
 * available
 */
export async function waitForMathJax() {
  await new Promise(resolve => {

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
    .replaceAll(/<span\b[^>]*>/gm, "").replaceAll("</span>", "")
    .replaceAll(/<([a-zA-Z]+)\b[^>]*>/gm, "<$1>");
}

/**
 * Removes all relevant HTML tags from a string, including those that are used in other parts of the code for formatting
 * @param {string} s 
 * @returns {string}
 */
export function stripTags(s) {
  return cleanTags(s)
    .replaceAll("<em>", "").replaceAll("</em>", "")
    .replaceAll("<strong>", "").replaceAll("</strong>", "")
    .replaceAll("<u>", "").replaceAll("</u>", "")
    .replaceAll("<sub>", "").replaceAll("</sub>", "")
    .replaceAll("<sup>", "").replaceAll("</sup>", "");
}

export function incrementRenderBatch() {
  return ++currentRenderBatch;
}

export async function drawFormatted(ctx, labelHTML, x, y, fontSize, hAlign, renderBatch) {
  if (labelHTML == "")
    return;

  const adaptor = MathJax.startup.adaptor;
  const mathJaxSVG = await MathJax.tex2svgPromise(getAsTex(labelHTML));
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

  drawMathJaxSVG(ctx, svgHTML, x, y, fontSize, hAlign, renderBatch);
}

function getAsTex(s) {
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
    s = s.replaceAll(/<strong>((?!<\/strong>).*?)<em>(.*?)<\/em>(.*?)<\/strong>/gm,
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

async function drawMathJaxSVG(ctx, svgHTML, x = 0, y = 0, fontsize = 16, hAlign = "left", renderBatch) {
  let DOMURL = window.URL || window.webkitURL || window;
  let img1 = new Image();
  let svg = new Blob([svgHTML], { type: 'image/svg+xml' });
  let url = DOMURL.createObjectURL(svg);
  let scale = MATHJAX_BASE_FONT_SCALING * fontsize / MATHJAX_DEFAULT_FONT_SIZE;

  // Keep track of the render batch where this was triggered, and only draw it if it's loaded in the same batch
  img1.renderBatch = renderBatch;

  img1.onload = function () {
    if (img1.renderBatch == currentRenderBatch) {
      let w = img1.naturalWidth * scale;
      let h = img1.naturalHeight * scale;
      let finalX = x;
      if (hAlign == "center")
        finalX -= w / 2;
      ctx.drawImage(img1, finalX, y, w, h);
    }
    DOMURL.revokeObjectURL(url);
  }
  img1.src = url;
}
