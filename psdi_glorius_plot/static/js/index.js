/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms, cleanDirtyForms } from "./common.js";
import { mix_hexes } from "./color.js"

const LABEL_FONT_FAMILY = "'Fira Sans', sans-serif";
const QUILL_THEME = "snow";
const QUILL_TOOLBAR = ['bold', 'italic', 'underline', { 'script': 'sub' }, { 'script': 'super' }];

const CONDITION = "condition";
const SAMPLE = "sample";
const OUTPUT = "output";

const L_DIMS = [CONDITION, SAMPLE, OUTPUT];

const COLOR_TRANSPARENT = "#FFFFFF00";

const D_DIM_LIMITS = {
  condition: {
    min: 3,
    max: 12
  },
  sample: {
    min: 1,
    max: 10
  },
  output: {
    min: 1,
    max: 2
  }
};

const D_COLOR_SCHEMES = {
  classic: {
    min: "#FF8080",
    max: "#20A020"
  },
  colourblind: {
    min: "#F05200",
    max: "#0093F5"
  },
  greyscale: {
    min: "#A0A0A0",
    max: "#A0A0A0"
  },
  custom: {
    min: null,
    max: null
  }

};

const CONDITION_PLACEHOLDER = "Condition (e.g. “High c”)";

const DEFAULT_VALUE_MEAN = 100;
const VALUE_MIN = 0.;
const VALUE_MAX = 100.;

const RAND_BASELINE_MIN = 60.;
const RAND_BASELINE_MAX = 100.;

const MATHJAX_DEFAULT_FONT_SIZE = 16;
const MATHJAX_BASE_FONT_SCALING = 1.125;
const WEBKIT_FONT_SCALING = 0.89;

const T_WAIT = 100;
const MAX_ELAPSED = 500;

const OUTPUT_LABEL_TEXT = "Output {N} Label:";

const D_DEV_PLOT_MODE_INFO = {
  relative: {
    beforeOutput: "Deviation of ",
    afterOutput: " from standard conditions (%)",
    stripBegin: null,
    stripEnd: " (%)"
  },
  absolute: {
    beforeOutput: "Deviation of ",
    afterOutput: " from standard conditions (+/-)",
    stripBegin: null,
    stripEnd: " (%)"
  },
  mean: {
    beforeOutput: "Mean ",
    afterOutput: "",
    stripBegin: null,
    stripEnd: null
  },
  value: {
    beforeOutput: "",
    afterOutput: "",
    stripBegin: null,
    stripEnd: null
  }
}

// Plot styling
const L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BORDER_WIDTH = 4;
const BASELINE_WIDTH = 4;
const BASELINE_COLOR = "#FFFFFF";
const DATA_BG_COLOR = [COLOR_TRANSPARENT];
const GRID_WIDTH = 1;
const GRID_COLOR = "#00000080";

// Globals
let tooltipList;

let autoUpdating = false;
let directInput = false;
let radarChart = null;

let lastAspectRatio;
let lastFontSizeWidthRatio;
let lastFontSizeHeightRatio;

let initWidth;
let initHeight;
let initFontSize;

let compatibilityMode = "unknown";
let webkitMode = null;

const dQuillEditors = {};

// When the script is initially loaded, store a copy of a heading element and cell elements that we'll later use
// as templates to add new rows

const TEMPLATE_OUTPUT_LABEL_ROW = $(".output-label-row")[0].cloneNode(true);
const TEMPLATE_BASELINE_INPUT_LINE = $(".baseline-input-line")[0].cloneNode(true);
const TEMPLATE_SAMPLE_INPUT_LINE = $(".sample-input-line")[0].cloneNode(true);
const TEMPLATE_MEAN_INPUT_LINE = $(".mean-input-line")[0].cloneNode(true);
const TEMPLATE_ABS_DEVIATION_INPUT_LINE = $(".abs-deviation-input-line")[0].cloneNode(true);
const TEMPLATE_REL_DEVIATION_INPUT_LINE = $(".rel-deviation-input-line")[0].cloneNode(true);

// Common functions

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

/**
 * Get whether or not a WebKit-based browser is being used
 */
function getWebKitMode() {
  if (webkitMode === null) {
    if (typeof window.webkitConvertPointFromNodeToPage === 'function')
      webkitMode = true;
    else
      webkitMode = false;
  }
  return webkitMode;
}

/**
 * MathJax is loaded asynchronously, so early calls to generate the plot may not have it. This waits to ensure it's
 * available
 */
async function waitForMathJax() {
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
function cleanTags(s) {
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
function stripTags(s) {
  return cleanTags(s)
    .replaceAll("<em>", "").replaceAll("</em>", "")
    .replaceAll("<strong>", "").replaceAll("</strong>", "")
    .replaceAll("<u>", "").replaceAll("</u>", "")
    .replaceAll("<sub>", "").replaceAll("</sub>", "")
    .replaceAll("<sup>", "").replaceAll("</sup>", "");
}

async function drawFormatted(ctx, labelHTML, x, y, fontSize, hAlign) {
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

  drawMathJaxSVG(ctx, svgHTML, x, y, fontSize, hAlign);
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

async function drawMathJaxSVG(ctx, svgHTML, x = 0, y = 0, fontsize = 16, hAlign = "left") {
  let DOMURL = window.URL || window.webkitURL || window;
  let img1 = new Image();
  let svg = new Blob([svgHTML], { type: 'image/svg+xml' });
  let url = DOMURL.createObjectURL(svg);
  let scale = MATHJAX_BASE_FONT_SCALING * fontsize / MATHJAX_DEFAULT_FONT_SIZE;
  img1.onload = function () {
    let w = img1.naturalWidth * scale;
    let h = img1.naturalHeight * scale;
    let finalX = x;
    if (hAlign == "center")
      finalX -= w / 2;
    ctx.drawImage(img1, finalX, y, w, h);
    DOMURL.revokeObjectURL(url);
  }
  img1.src = url;
}

// Plugins for Chart JS
const customCanvasBackgroundColorPlugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.color || '#99ffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

/**
 * Get the index value stored at the end of an event's target's ID
 */
function getIndexFromEvent(e) {
  let eId = e.target.id;
  return +(eId.split("-").at(-1));
}

function disableButton(button) {
  button.prop({ disabled: true });
}

function enableButton(button) {
  button.prop({ disabled: false });
}

function getDimSize(dim) {
  if (dim == CONDITION)
    return getNumConditions();
  else if (dim == OUTPUT)
    return getNumOutputs();
  else
    return getNumSamples();
}

function getNumConditions() {
  return $(".condition-row").length;
}

function getNumOutputs() {
  return $(".output-label-row").length;
}

function getNumSamples() {
  return $(".sample-heading").length;
}

function addDim(dim, e, updateAfter) {
  if (dim == CONDITION)
    return addConditionRow(e, updateAfter);
  else if (dim == SAMPLE)
    return addSampleCol(e, updateAfter);
  else
    return addOutput(e, updateAfter);
}

function removeDim(dim, e, updateAfter) {
  if (dim == CONDITION)
    return removeConditionRow(e, updateAfter);
  else if (dim == SAMPLE)
    return removeSampleCol(e, updateAfter);
  else
    return removeOutput(e, updateAfter);
}

function setNumDim(dim, num, updateAfter = true) {

  const numDim = getDimSize(dim);

  if (numDim < num) {
    for (let i = 0; i < num - numDim; ++i) {
      addDim(dim, null, false);
    }
  } else if (numDim > num) {
    for (let i = 0; i < numDim - num; ++i) {
      removeDim(dim, null, false);
    }
  } else {
    return;
  }

  postTableUpdateCleanup(dim, updateAfter);
}

function updateDimSelector(dim) {
  $("select#num-" + dim).val(getDimSize(dim)).change();
}

function updateButtonStatus(dim) {
  const num = getDimSize(dim);

  if (num >= D_DIM_LIMITS[dim].max)
    disableButton($("button.add-" + dim));
  else
    enableButton($("button.add-" + dim));

  if (num <= D_DIM_LIMITS[dim].min)
    disableButton($("button.remove-" + dim));
  else
    enableButton($("button.remove-" + dim));
}

function postTableUpdateCleanup(dim, updateAfter) {

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateButtonStatus(dim);
    updateDimSelector(dim);
    initNumDimControls(dim);
    relabelDim(dim);
    updateMeanColumn();
    updatePlotSelect();

    // Also update the plot if desired
    if (autoUpdating) {
      enableAutoUpdates();
    }
  }
}

function getTargetIndex(e, max) {
  let targetIndex;
  if (e === null)
    targetIndex = max - 1;
  else
    targetIndex = getIndexFromEvent(e);
  return targetIndex
}

/**
 * Relabel IDs and labels after a dimension is added to the table
 */
function relabelDim(dim) {

  const d = dim[0];
  const num = getDimSize(dim);
  const lButtonCells = $(`.${dim}-button-cell`);
  const lHeadings = $(`.${dim}-heading`);
  const lLabels = $(`.${dim}-label`);
  const lInputs = $(`.${dim}-input`);

  for (let i = 0; i < num; i++) {
    const sI = i.toString();
    const sI1 = (i + 1).toString();

    // Fix the IDs of the buttons
    const buttonCell = lButtonCells.eq(i);
    buttonCell.find(".remove-" + dim).attr("id", `remove-${d}b-${sI}`);
    buttonCell.find(".add-" + dim).attr("id", `add-${d}b-${sI}`);

    // Set the heading text if we have any heading cells
    if (lHeadings.length > 0) {
      let headingText = dQuillEditors["#ol-0"].getSemanticHTML();
      updateOutputLabel(headingText);
    }

    // Set the label and input text if we have any of those cells
    if (lInputs.length > 0) {
      lInputs.eq(i).attr("id", `${d}l-${sI}`);
      if (lLabels.length > 0) {
        const label = lLabels.eq(i);
        label.text(OUTPUT_LABEL_TEXT.replace("{N}", sI1));
        label.attr("for", `${d}l-${sI}`);
      }
    }
  }

}

/**
 * Make the means visible only if we have more than one sample column, and set the proper heading label for it
 */
function updateMeanColumn() {
  const meanElements = $(".button-mean-cell, .mean-heading, .baseline-mean-cell, .mean-value-cell, " +
    ".empty-cell.mean-shown-only");
  if (getNumSamples() > 1)
    meanElements.removeClass("hidden");
  else
    meanElements.addClass("hidden");

  $(".mean-heading").text("Mean " + $("#ol-0").val());
}

function addConditionRow(e, updateAfter = true) {

  // Check that we don't already have too many conditions
  const oldNumConditions = getNumConditions();
  if (oldNumConditions >= D_DIM_LIMITS.condition.max) {
    console.error("Attempt to add condition when maximum rows already reached");
    return;
  }

  // Construct a new row by copying the first and clearing its input
  const newRow = $(".condition-row")[0].cloneNode(true);
  $(newRow).find(".condition-input .ql-editor p").html("");
  $(newRow).find(".sample-value").val("");
  $(newRow).find(".mean-value").val("100");
  $(newRow).find(".abs-deviation-value").val("0");
  $(newRow).find(".rel-deviation-value").val("0");

  // Determine where to add the row based on which button was clicked
  const targetRowIndex = getTargetIndex(e, oldNumConditions);

  if (targetRowIndex >= oldNumConditions - 1)
    $(".sensitivity-table tbody")[0].insertBefore(newRow, $("#plot-select-row")[0]);
  else
    $(".sensitivity-table tbody")[0].insertBefore(newRow, $(".condition-row")[targetRowIndex + 1]);

  if (updateAfter) {
    // Temporarily disable auto-updating the plot if it's enabled
    const lastAutoUpdating = autoUpdating;
    autoUpdating = false;
    postTableUpdateCleanup("condition", updateAfter);
    autoUpdating = lastAutoUpdating;
  }
  else {
    // We need to at least relabel the elements so we can clean up Quill editors
    relabelDim("condition");
  }

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = oldNumConditions; i > targetRowIndex + 1; --i) {
    dQuillEditors["#cl-" + i] = dQuillEditors["#cl-" + (i - 1)];
    delete dQuillEditors["#cl-" + (i - 1)];
  }
  $("#cl-" + (targetRowIndex + 1)).html("");
  addQuillEditor("#cl-" + (targetRowIndex + 1), CONDITION_PLACEHOLDER);
  enableQuillEvents();

  // If we skipped updating the plot before, do it now
  if (updateAfter && autoUpdating)
    generatePlot();
}

function removeConditionRow(e, updateAfter = true) {

  // Check that we don't already have too few rows
  const oldNumConditions = getNumConditions();
  if (oldNumConditions <= D_DIM_LIMITS.condition.min) {
    console.error("Attempt to remove row when minimum rows already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  const targetRowIndex = getTargetIndex(e, oldNumConditions);

  // Remove the Quill editor first, so we don't hit a dangling reference by doing this after removing the row
  removeQuillEditor("#cl-" + targetRowIndex);

  // Remove the row from the table
  $(".sensitivity-table tbody")[0].removeChild($(".condition-row")[targetRowIndex]);

  if (updateAfter) {
    // Temporarily disable auto-updating the plot if it's enabled
    const lastAutoUpdating = autoUpdating;
    autoUpdating = false;
    postTableUpdateCleanup("condition", updateAfter);
    autoUpdating = lastAutoUpdating;
  }
  else {
    // We need to at least relabel the elements so we can clean up Quill editors
    relabelDim("condition");
  }

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = targetRowIndex; i < oldNumConditions - 1; ++i) {
    dQuillEditors["#cl-" + i] = dQuillEditors["#cl-" + (i + 1)];
    delete dQuillEditors["#cl-" + (i + 1)];
  }
  enableQuillEvents();

  // If we skipped updating the plot before, do it now
  if (updateAfter && autoUpdating)
    generatePlot();
}

function addSampleCol(e, updateAfter = true) {

  // Check that we don't already have too many samples
  const numSamples = getNumSamples();
  if (numSamples >= D_DIM_LIMITS.sample.max) {
    console.error("Attempt to add sample when maximum samples already reached");
    return;
  }

  // Determine where to add the column based on which button was clicked
  const targetColIndex = getTargetIndex(e, numSamples);

  // Construct and insert a new button cell, heading cell, and baseline value cell
  const newButtonCell = $(".sample-button-cell")[0].cloneNode(true);
  const newHeadingCell = $(".sample-heading")[0].cloneNode(true);
  const newBaselineValueCell = $(".baseline-value-cell")[0].cloneNode(true);
  $(newBaselineValueCell).find(".baseline-value").val("");
  const newEmptyCell = $("#plot-select-row .empty-cell")[0].cloneNode(true);

  if (targetColIndex >= numSamples - 1) {
    $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".button-mean-cell")[0]);
    $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".mean-heading")[0]);
    $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-mean-cell")[0]);
  } else {
    $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".sample-button-cell")[targetColIndex + 1]);
    $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".sample-heading")[targetColIndex + 1]);
    $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-value-cell")[targetColIndex + 1]);
  }

  // All empty cells are identical, so we don't worry about exact positioning for it
  $("#plot-select-row")[0].insertBefore(newEmptyCell, $("#plot-select-row .empty-cell.mean-shown-only")[0]);

  // For each row of the table, construnct and insert a new value cell
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; i++) {
    const conditionRow = $(".condition-row")[i];
    const lValueCells = $(conditionRow).find(".sample-value-cell");
    const newValueCell = lValueCells[0].cloneNode(true);
    $(newValueCell).find(".sample-value").val("");

    if (targetColIndex >= numSamples - 1)
      conditionRow.insertBefore(newValueCell, $(conditionRow).find(".mean-value-cell")[0]);
    else
      conditionRow.insertBefore(newValueCell, lValueCells[targetColIndex + 1]);
  }

  postTableUpdateCleanup("sample", updateAfter);
}

function removeSampleCol(e, updateAfter = true) {

  // Check that we don't already have too few samples
  const numSamples = getNumSamples();
  if (numSamples <= D_DIM_LIMITS.sample.min) {
    console.error("Attempt to remove sample when minimum samples already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  const targetColIndex = getTargetIndex(e, numSamples);

  // Remove the appropriate button cell, heading cell, and baseline cell

  $(".sensitivity-buttons")[0].removeChild($(".sample-button-cell")[targetColIndex]);
  $(".sensitivity-header")[0].removeChild($(".sample-heading")[targetColIndex]);
  $(".baseline-row")[0].removeChild($(".baseline-value-cell")[targetColIndex]);
  $("#plot-select-row")[0].removeChild($("#plot-select-row .empty-cell")[targetColIndex]);

  // For each row of the table, remove the appropriate value cell
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; i++) {
    const conditionRow = $(".condition-row")[i];
    conditionRow.removeChild($(conditionRow).find(".sample-value-cell")[targetColIndex]);
  }

  postTableUpdateCleanup("sample", updateAfter);
}

function addOutput(e, updateAfter = true) {

  // Check that we don't already have too many outputs
  const numOutputs = getNumOutputs();
  if (numOutputs >= D_DIM_LIMITS.output.max) {
    console.error("Attempt to add output when maximum outputs already reached");
    return;
  }

  // Set up the new output label row
  const newOutputLabelRow = TEMPLATE_OUTPUT_LABEL_ROW.cloneNode(true);
  $(newOutputLabelRow).find(".output-input").val("");

  // Determine where to add the row based on which button was clicked
  const targetOutputIndex = getTargetIndex(e, numOutputs);

  if (targetOutputIndex >= numOutputs - 1)
    $(".output-label-table tbody")[0].appendChild(newOutputLabelRow);
  else
    $(".output-label-table tbody")[0].insertBefore(newOutputLabelRow, $(".output-label-row")[targetOutputIndex + 1]);

  // Add a new input line to each value cell
  $(".baseline-value-cell, .sample-value-cell, .mean-value-cell, .abs-deviation-value-cell, " +
    ".rel-deviation-value-cell").each(function () {
      // Clone a new node from the proper template
      let templateLine;
      if (this.classList.contains("sample-value-cell"))
        templateLine = TEMPLATE_SAMPLE_INPUT_LINE;
      else if (this.classList.contains("baseline-value-cell"))
        templateLine = TEMPLATE_BASELINE_INPUT_LINE;
      else if (this.classList.contains("mean-value-cell"))
        templateLine = TEMPLATE_MEAN_INPUT_LINE;
      else if (this.classList.contains("abs-deviation-value-cell"))
        templateLine = TEMPLATE_ABS_DEVIATION_INPUT_LINE;
      else
        templateLine = TEMPLATE_REL_DEVIATION_INPUT_LINE;

      const newSensInputLine = templateLine.cloneNode(true);

      if (targetOutputIndex >= numOutputs - 1)
        this.appendChild(newSensInputLine);
      else
        this.insertBefore(newSensInputLine, this.children[targetOutputIndex + 1]);
    })

  postTableUpdateCleanup("output", updateAfter);
}

function removeOutput(e, updateAfter = true) {

  // Check that we don't already have too few outputs
  const numOutputs = getNumOutputs();
  if (numOutputs <= D_DIM_LIMITS.output.min) {
    console.error("Attempt to remove output when minimum outputs already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  const targetOutputIndex = getTargetIndex(e, numOutputs);

  // Remove the row from the output label table
  $(".output-label-table tbody")[0].removeChild($(".output-label-row")[targetOutputIndex]);

  // Remove the input line from each cell in the sens table
  $(".baseline-value-cell, .sample-value-cell, .mean-value-cell, .abs-deviation-value-cell, " +
    ".rel-deviation-value-cell").each(function () {
      this.removeChild(this.children[targetOutputIndex]);
    });

  postTableUpdateCleanup("output", updateAfter);
}

function updateCanvasShape() {
  $("#glorius-plot").css({
    "width": getWidth().toString(),
    "height": getHeight().toString()
  })
}

/**
 * Called when the width is updated, so that if the aspect ratio is locked, the height can be updated as well, and
 * similarly if font scaling is enabled
 */
function updateWidth() {

  if (getAspectRatioLock())
    $("#height-input").val(getWidth() / lastAspectRatio);
  else
    lastAspectRatio = getAspectRatio();

  if (getFontSizeScaleLock()) {
    $("#font-size-input").val(getWidth() * lastFontSizeWidthRatio);
    lastFontSizeHeightRatio = getFontSizeHeightRatio();
  } else {
    lastFontSizeWidthRatio = getFontSizeWidthRatio();
  }

  if (autoUpdating)
    updateCanvasShape();
}

/**
 * Called when the height is updated, so that if the aspect ratio is locked, the width can be updated as well, and
 * similarly if font scaling is enabled
 */
function updateHeight() {

  if (getAspectRatioLock())
    $("#width-input").val(getHeight() * lastAspectRatio);
  else
    lastAspectRatio = getAspectRatio();

  if (getFontSizeScaleLock()) {
    $("#font-size-input").val(getHeight() * lastFontSizeHeightRatio);
    lastFontSizeWidthRatio = getFontSizeWidthRatio();
  } else {
    lastFontSizeHeightRatio = getFontSizeHeightRatio();
  }

  if (autoUpdating)
    updateCanvasShape();
}

/**
 * Called when the font size is updated to update the font size scales
 */
function updateFontSize() {
  lastFontSizeWidthRatio = getFontSizeWidthRatio();
  lastFontSizeHeightRatio = getFontSizeHeightRatio();
}

/**
 * Reset the width, height, and font size to their initial values, and also update globals tracking the ratios
 */
function resetPlotDims() {
  $("#width-input").val(initWidth);
  $("#height-input").val(initHeight);
  $("#font-size-input").val(initFontSize);

  lastAspectRatio = getAspectRatio();
  updateFontSize();

  if (autoUpdating)
    generatePlot();
}


// Functions to get various options set by the user

function getTitle() {
  return dQuillEditors["#title-input"].getSemanticHTML();
}

function getOutputLabel(j = 0) {

  // Get the deviation plot mode, and check in case it's mean with only one sample. In that case, use different text
  // for it
  let devPlotMode = getDevPlotMode();
  if (devPlotMode == "mean" && getNumSamples() == 1)
    devPlotMode = "value";

  const dDevPlotModeInfo = D_DEV_PLOT_MODE_INFO[devPlotMode];

  // Get the cleaned output label
  let outputLabel = dQuillEditors["#ol-0"].getSemanticHTML();
  outputLabel = cleanTags(outputLabel);

  // Strip appropriate strings from the beginning and end of the output label
  if (dDevPlotModeInfo.stripEnd != null && (outputLabel.endsWith(dDevPlotModeInfo.stripEnd))) {
    outputLabel = outputLabel.slice(0, -dDevPlotModeInfo.stripEnd.length);
  }
  if (dDevPlotModeInfo.stripBegin != null && (outputLabel.endsWith(dDevPlotModeInfo.stripBegin))) {
    outputLabel = outputLabel.slice(dDevPlotModeInfo.stripBegin.length);
  }

  // Add appropriate segments to the beginning and end of the output label
  outputLabel = dDevPlotModeInfo.beforeOutput + outputLabel + dDevPlotModeInfo.afterOutput;

  return outputLabel;
}

function getConditionLabelHTML(i) {
  return dQuillEditors["#cl-" + i].getSemanticHTML();
}

function getLConditionLabelsHTML() {
  const lCondtionLabelsHTML = [];
  $(".condition-input").each((i, e) => {
    lCondtionLabelsHTML.push(getConditionLabelHTML(i));
  })
  return lCondtionLabelsHTML;
}

function getDevPlotMode() {
  const lPlotSelectRadio = $("input.plot-select");
  let rVal = "absolute";
  lPlotSelectRadio.each(function () {
    const oThis = $(this);
    if (oThis.is(":checked"))
      rVal = oThis.val();
  });
  return rVal;
}

function getWidth() {
  return +$("#width-input").val();
}

function getHeight() {
  return +$("#height-input").val();
}

function getFontSize() {
  return +$("#font-size-input").val();
}

function getAspectRatio() {
  return getWidth() / getHeight();
}

function getAspectRatioLock() {
  return $("#lock-aspect-ratio").is(":checked");
}

function getFontSizeWidthRatio() {
  return getFontSize() / getWidth();
}

function getFontSizeHeightRatio() {
  return getFontSize() / getHeight();
}

function getFontSizeScaleLock() {
  return $("#scale-font-size").is(":checked");
}

function getMinOutput() {
  if (getDevPlotMode() == "mean")
    return 0;
  let minOutput = $("#min-output-input").val();
  minOutput = clamp(minOutput, -100, -1);
  return minOutput;
}

function getMaxOutput() {
  if (getDevPlotMode() == "mean")
    return 100;
  let maxOutput = $("#max-output-input").val();
  maxOutput = clamp(maxOutput, 1, 1000);
  return maxOutput;
}

function getOutputMidpoint() {
  // TODO: Update to depend on which column is selected to plot
  if (getDevPlotMode() != "mean")
    return 0;
  return +($(".baseline-row").find(".mean-value").eq(0).val());
}

function getBandWidth() {
  let bandWidth = $("#band-width-input").val();
  bandWidth = clamp(bandWidth, 1, 1000);
  return bandWidth;
}

function getMinColor() {
  return $("#min-color-input").val();
}

function getMaxColor() {
  return $("#max-color-input").val();
}

function getFanMode() {
  return $("#fan-toggle").is(":checked");
}

function getTipSize() {
  return +$("#fan-tip-size").val();
}

function getBarSeparation() {
  return +$("#fan-bar-separation").val();
}

function getShowGridLines() {
  return $("#grid-line-toggle").is(":checked");
}

function getShowAxisLines() {
  return $("#axis-line-toggle").is(":checked");
}

/**
 * Get how the data should be sorted
 * @returns {int} 1 if ascending, -1 if descending, 0 if as entered
 */
function getDataSorting() {
  return +($("#sort-option").find(":selected").val());
}

/**
 * Calculate the deviation for each condition
 */
function calcDeviation() {
  const numConditions = getNumConditions();
  const numOutputs = getNumOutputs();
  const numSamples = getNumSamples();

  const baselineRow = $(".baseline-row");
  const lBaselineCells = baselineRow.find(".baseline-value-cell");
  const lBaselineMeanInputs = baselineRow.find(".mean-value");

  // Start by calculating the mean baseline for each output
  const lBaselineMeans = [];
  const llBaselineSamples = [];
  for (let j = 0; j < numOutputs; j++) {
    llBaselineSamples.push([]);
  }

  for (let k = 0; k < numSamples; k++) {

    const baselineSampleCell = lBaselineCells.eq(k);

    for (let j = 0; j < numOutputs; j++) {
      const baselineSampleVal = baselineSampleCell.find(".baseline-value").eq(j).val();
      if (baselineSampleVal != "") {
        llBaselineSamples[j].push(+baselineSampleVal);
      }
    }
  }

  for (let j = 0; j < numOutputs; j++) {
    const lBaselineSamples = llBaselineSamples[j];
    let baselineMean;
    if (lBaselineSamples.length > 0)
      baselineMean = lBaselineSamples.reduce((a, b) => a + b) / lBaselineSamples.length;
    else
      baselineMean = DEFAULT_VALUE_MEAN;

    lBaselineMeans.push(baselineMean);
    lBaselineMeanInputs.eq(j).val(Math.round(baselineMean));
  }

  // Now calculate the mean for each output of each condition, and use it and the baseline mean to calculate and fill in
  // the deviation

  const lConditionRows = $(".condition-row");

  for (let i = 0; i < numConditions; i++) {

    const conditionRow = lConditionRows.eq(i);
    const lConditionCells = conditionRow.find(".sample-value-cell");

    const llConditionSamples = [];
    for (let j = 0; j < numOutputs; j++) {
      llConditionSamples.push([]);
    }

    for (let k = 0; k < numSamples; k++) {

      const conditionSampleCell = lConditionCells.eq(k);

      for (let j = 0; j < numOutputs; j++) {
        const conditionSampleVal = conditionSampleCell.find(".sample-value").eq(j).val();
        if (conditionSampleVal != "") {
          llConditionSamples[j].push(+conditionSampleVal);
        }
      }
    }

    const lMeanInputs = conditionRow.find(".mean-input-line");
    const lAbsDeviationInputs = conditionRow.find(".abs-deviation-input-line");
    const lRelDeviationInputs = conditionRow.find(".rel-deviation-input-line");
    for (let j = 0; j < numOutputs; j++) {

      const baselineMean = lBaselineMeans[j];
      const lConditionSamples = llConditionSamples[j];

      let conditionMean;
      if (lConditionSamples.length > 0)
        conditionMean = lConditionSamples.reduce((a, b) => a + b) / lConditionSamples.length;
      else
        conditionMean = baselineMean;

      const absDeviation = conditionMean - baselineMean;
      const relDeviation = (conditionMean - baselineMean) / baselineMean * 100;

      lMeanInputs.eq(j).find(".mean-value").val(Math.round(conditionMean));
      lAbsDeviationInputs.eq(j).find(".abs-deviation-value").val(Math.round(absDeviation));
      lRelDeviationInputs.eq(j).find(".rel-deviation-value").val(Math.round(relDeviation));
    }

  }
}

/**
 * Generate the plot using all the provided data
 */
async function generatePlot() {

  // Set the form as clean when we generate a plot from it
  cleanDirtyForms();

  // Ensure deviation is calculated first if we aren't in directInput mode
  if (!directInput) {
    calcDeviation();
  }

  // Collect info from the settings and determine data based on them
  const numConditions = getNumConditions();
  const numOutputs = getNumOutputs();

  const minOutput = getMinOutput();
  const maxOutput = getMaxOutput();
  const outputMidpoint = getOutputMidpoint();
  const bandWidth = getBandWidth();

  const fanMode = getFanMode();

  const showGridLines = getShowGridLines();
  const showAxisLines = getShowAxisLines();

  const minColor = getMinColor();
  const maxColor = getMaxColor();

  const tipSize = getTipSize();
  const baseSeparation = getBarSeparation();
  const barSize = 2 * (tipSize + baseSeparation + 1);
  const numAnglePoints = numConditions * barSize;

  // Create data we'll plot in the chart
  const lOutputLabels = [];
  const llData = [];
  const lOrder = [];
  const lBorderColors = [];
  const lBorderWidths = [];
  const lBackgroundColors = [];
  const lFill = [];
  const lBorderDashes = [];

  let numAxisLines;

  let numBgColorsLow;
  let numBgColorsHi;
  let numBgColors;

  let numDatasetMultiplier;


  // If in radar mode, we make some fake data to use as background colors and grid lines

  if (fanMode) {
    numAxisLines = 0;

    numBgColorsLow = 0;
    numBgColorsHi = 0;
    numBgColors = 0;

    numDatasetMultiplier = numConditions;
  }

  // Make a fake dataset at the midpoint value, which we can use as a reference as needed
  lOutputLabels.push("");
  let lMidpointData = [];
  let numMidpointPoints = numConditions;

  if (fanMode)
    numMidpointPoints = numAnglePoints;

  for (let i = 0; i < numMidpointPoints; ++i) {
    lMidpointData.push(outputMidpoint);
  }

  llData.push(lMidpointData);
  lOrder.push(1);
  lBorderColors.push(BASELINE_COLOR);
  lBackgroundColors.push(BASELINE_COLOR);
  lFill.push(false);
  lBorderDashes.push([]);

  if (fanMode)
    lBorderWidths.push(0);
  else
    lBorderWidths.push(BASELINE_WIDTH);

  if (!fanMode) {

    // Make fake data for each background color

    const numLowBands = Math.ceil((outputMidpoint - minOutput) / bandWidth);
    const numHiBands = Math.ceil((maxOutput - outputMidpoint) / bandWidth);

    numBgColorsLow = numLowBands;
    numBgColorsHi = numHiBands + 1;
    numBgColors = numBgColorsLow + numBgColorsHi;

    numDatasetMultiplier = 1;

    const lBgColorBoundsLow = [];
    const lBgOrderLow = [];
    for (let i = 0; i < numBgColorsLow; ++i) {
      lBgColorBoundsLow.push(Math.max(outputMidpoint - bandWidth * (i + 1), minOutput));
      lBgOrderLow.push(i + 1);
    }

    const lBgColorBoundsHi = [];
    const lBgOrderHi = [];
    for (let i = 0; i < numBgColorsHi; ++i) {
      lBgColorBoundsHi.push(Math.min(outputMidpoint + bandWidth * i, maxOutput));
      lBgOrderHi.push(i + 1);
    }

    for (let k = 0; k < numBgColorsHi; ++k) {
      lOutputLabels.push("");
      let lFakeData = [];
      for (let i = 0; i < numConditions; ++i) {
        lFakeData.push(lBgColorBoundsHi[k]);
      }
      llData.push(lFakeData);
      lOrder.push(lBgOrderHi[k]);

      let colorRatio = 1;
      if (numBgColorsHi > 1)
        colorRatio = k / (numBgColorsHi - 1);
      let backgroundColor = mix_hexes(maxColor, "#FFFFFF", colorRatio);
      lBackgroundColors.push(backgroundColor);

      if (showGridLines) {
        lBorderColors.push(GRID_COLOR);
        lBorderWidths.push(GRID_WIDTH);
      } else {
        lBorderColors.push(backgroundColor);
        lBorderWidths.push(0);
      }

      lFill.push(0);
      lBorderDashes.push([]);
    }

    for (let k = 0; k < numBgColorsLow; ++k) {
      lOutputLabels.push("");
      let lFakeData = [];
      for (let i = 0; i < numConditions; ++i) {
        lFakeData.push(lBgColorBoundsLow[k]);
      }
      llData.push(lFakeData);
      lOrder.push(lBgOrderLow[k]);

      let colorRatio = (k + 1) / numBgColorsLow;
      let backgroundColor = mix_hexes(minColor, "#FFFFFF", colorRatio);
      lBackgroundColors.push(backgroundColor);

      if (showGridLines) {
        lBorderColors.push(GRID_COLOR);
        lBorderWidths.push(GRID_WIDTH);
      } else {
        lBorderColors.push(backgroundColor);
        lBorderWidths.push(0);
      }

      lFill.push(0);
      lBorderDashes.push([]);
    }

    // Make fake data for each axis line we want to draw if desired
    if (showAxisLines) {
      numAxisLines = numConditions;
      for (let k = 0; k < numConditions; ++k) {
        lOutputLabels.push("");
        let lFakeData = [];
        for (let i = 0; i < numConditions; ++i) {
          if (i == k)
            lFakeData.push(minOutput)
          else
            lFakeData.push(maxOutput)
        }
        llData.push(lFakeData);
        lOrder.push(-1);
        lBorderColors.push(GRID_COLOR);
        lBorderWidths.push(GRID_WIDTH);
        lBackgroundColors.push(DATA_BG_COLOR);
        lFill.push(false);
        lBorderDashes.push([]);
      }
    } else {
      numAxisLines = 0;
    }
  }

  const lConditionLabels = getLConditionLabelsHTML();

  // Make a fake dataset to add the label to the legend for each output
  const devPlotMode = getDevPlotMode();

  for (let j = 0; j < numOutputs; ++j) {

    lOutputLabels.push(stripTags(getOutputLabel(j)));

    let lInvisibleData = [];
    let numInvisiblePoints = numConditions;

    if (fanMode)
      numMidpointPoints = numAnglePoints;

    for (let i = 0; i < numInvisiblePoints; ++i) {
      if (i == 0)
        lInvisibleData.push(outputMidpoint)
      else
        lInvisibleData.push(null);
    }

    llData.push(lInvisibleData);
    lOrder.push(999);
    lBorderColors.push("black");
    lBorderWidths.push(BORDER_WIDTH);
    lBorderDashes.push(L_BORDER_DASHES[j]);
    lBackgroundColors.push("white");
    lFill.push(false);
  }

  // Get data for each output
  for (let j = 0; j < numOutputs * numDatasetMultiplier; ++j) {
    llData.push([]);
  }

  const lSensRows = $(".condition-row");
  const lConditionData = [];
  for (let i = 0; i < numConditions; ++i) {
    let lSingleConditionData = [];

    let valueSelector;
    let inputSelector;
    if (devPlotMode == "mean") {
      valueSelector = ".mean-value-cell"
      inputSelector = "input.mean-value"
    } else if (devPlotMode == "absolute") {
      valueSelector = ".abs-deviation-value-cell"
      inputSelector = "input.abs-deviation-value"
    } else {
      valueSelector = ".rel-deviation-value-cell"
      inputSelector = "input.rel-deviation-value"
    }
    const lCells = lSensRows.eq(i).find(valueSelector);
    const lInputs = lCells.eq(0).find(inputSelector);

    for (let j = 0; j < numOutputs; ++j) {
      lSingleConditionData.push(lInputs[j].value);
    }
    lConditionData.push({
      label: stripTags(lConditionLabels[i]),
      labelHTML: cleanTags(lConditionLabels[i]),
      data: lSingleConditionData,
      displayIndex: i
    })
  }

  // Sort the data by the first value, depending on the sort mode
  let sort_mode = getDataSorting();
  lConditionData.sort(function (a, b) {
    return (a.data[0] - b.data[0]) * sort_mode;
  });

  // Fix the displayIndex for each item
  lConditionData.map((d, i) => {
    d.displayIndex = i;
  })

  let lOutputConditionLabels = lConditionLabels;
  if (fanMode) {
    lOutputConditionLabels = [];
    for (let l = 0; l < numAnglePoints; ++l)
      lOutputConditionLabels.push("");
  }

  // Add the sorted data to the main data array, and update the row labels
  for (let i = 0; i < numConditions; ++i) {

    let conditionData = lConditionData[i];

    if (fanMode) {

      for (let j = 0; j < numOutputs; ++j) {

        const lData = llData[1 + numBgColors + numAxisLines + i + j * numConditions + numOutputs];
        const tipCenter = barSize * (i + 0.5 + 0.5 * j / numOutputs);

        for (let l = 0; l < numAnglePoints; ++l) {
          if (j == 0 && l == tipCenter) {
            lOutputConditionLabels[l] = conditionData.label;
            conditionData.displayIndex = l;
          }

          // Calculate how far the point is from the tip center, taking into account that it's a circular array
          let tipDistance = Math.abs(l - tipCenter);
          if (tipDistance > numAnglePoints / 2)
            tipDistance = numAnglePoints - tipDistance;

          // Set the point value based on the distance from the tip center
          if (tipDistance <= tipSize)
            lData.push(clamp(conditionData.data[j], minOutput, maxOutput));
          else if (tipDistance <= tipSize + 1)
            lData.push(outputMidpoint);
          else if (j == 0 && tipDistance <= tipSize + baseSeparation + 1)
            lData.push(outputMidpoint);
          else
            lData.push(null);
        }
      }
    } else {
      lOutputConditionLabels[i] = conditionData.label;
      for (let j = 0; j < numOutputs; ++j) {
        llData[1 + numBgColors + numAxisLines + j + numOutputs].push(clamp(conditionData.data[j], minOutput, maxOutput));
      }
    }
  }

  // Get the output labels, and also set other fixed data for normal datasets
  for (let j = 0; j < numOutputs; ++j) {

    for (let i = 0; i < numDatasetMultiplier; ++i) {
      lOutputLabels.push("")
      lOrder.push(0);
      lBorderColors.push("black");
      lBorderWidths.push(BORDER_WIDTH);
      lBorderDashes.push(L_BORDER_DASHES[j]);

      if (fanMode) {
        let color;
        let clampedVal = clamp(lConditionData[i].data[j], minOutput, maxOutput);
        if (clampedVal >= outputMidpoint) {
          if (maxOutput == outputMidpoint) {
            color = maxColor;
          } else {
            let colorRatio = (clampedVal - outputMidpoint) / (maxOutput - outputMidpoint);
            color = mix_hexes(maxColor, "#FFFFFF", colorRatio);
          }
        }
        else {
          if (minOutput == outputMidpoint) {
            color = minColor;
          } else {
            let colorRatio = (outputMidpoint - clampedVal) / (outputMidpoint - minOutput);
            color = mix_hexes(minColor, "#FFFFFF", colorRatio);
          }
        }
        lBackgroundColors.push(color);
        lFill.push(0);
      } else {
        lBackgroundColors.push(DATA_BG_COLOR);
        lFill.push(false);
      }
    }
  }

  // Prepare the data as Datasets in the format expected by ChartJS
  const lDatasets = [];
  for (let j = 0; j < 1 + numBgColors + numAxisLines + numOutputs * (1 + numDatasetMultiplier); ++j) {
    lDatasets.push({
      label: lOutputLabels[j],
      data: llData[j],
      order: lOrder[j],
      borderColor: lBorderColors[j],
      borderWidth: lBorderWidths[j],
      backgroundColor: lBackgroundColors[j],
      borderDash: lBorderDashes[j],
      pointRadius: 0,
      fill: lFill[j]
    })
  }

  // Prepare the plot options

  // Use the user's desired font size for labels to get ideal positioning. Since WebKit displays it larger for some
  // reason, we apply a scaling factor if a WebKit browser is being used
  const fontSize = getFontSize();
  let alignmentFontSize = fontSize;
  if (getWebKitMode())
    alignmentFontSize *= WEBKIT_FONT_SCALING;

  const plotROptions = {
    grid: {
      circular: fanMode
    },
    min: minOutput,
    max: maxOutput,
    pointLabels: {
      font: {
        family: LABEL_FONT_FAMILY,
        size: alignmentFontSize
      },
      // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
      // optimal positioning, which is why we don't filter it all out.
      color: COLOR_TRANSPARENT,
    },
    reverse: true,
    ticks: {
      stepSize: bandWidth,
      z: 2,
    }
  };

  const plotLegendOptions = {
    position: "bottom",
    labels: {
      boxHeight: fontSize,
      boxWidth: fontSize,
      font: {
        family: LABEL_FONT_FAMILY,
        size: alignmentFontSize,
        weight: "bold"
      },
      // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
      // optimal positioning, which is why we don't filter it all out.
      color: COLOR_TRANSPARENT,
      filter: function (legendLabel, _) {
        return legendLabel.text != "";
      }
    }
  }

  const titleHTML = getTitle();
  const titleHTMLText = stripTags(titleHTML);

  const plotTitleOptions = {
    display: (titleHTMLText != ""),
    text: titleHTMLText,
    font: {
      family: LABEL_FONT_FAMILY,
      size: alignmentFontSize,
      weight: "bold"
    },
    // Hide the normal label, since we implement it ourselves with custom styling. We still use it so we get the
    // optimal positioning, which is why we don't filter it all out.
    color: COLOR_TRANSPARENT,
  }

  if (radarChart === null) {
    // Generate the plot for the first time
    radarChart = new Chart("glorius-plot", {
      type: "radar",
      data: {
        labels: lOutputConditionLabels,
        datasets: lDatasets,
      },
      plugins: [customCanvasBackgroundColorPlugin],
      options: {
        aspectRatio: getAspectRatio(),
        events: ['mousemove', 'mouseout', 'touchstart', 'touchmove'],
        responsive: false,
        scales: {
          r: plotROptions
        },
        plugins: {
          customCanvasBackgroundColor: {
            color: "white",
          },
          legend: plotLegendOptions,
          title: plotTitleOptions
        },
        animation: false
      }
    })
  } else {
    radarChart.data = {
      labels: lOutputConditionLabels,
      datasets: lDatasets,
    }
    radarChart.options.aspectRatio = getAspectRatio();
    radarChart.options.scales.r = plotROptions;
    radarChart.options.plugins.legend = plotLegendOptions;
    radarChart.options.plugins.title = plotTitleOptions;
    radarChart.resize(getWidth(), getHeight());
    radarChart.update();
  }

  // Manually draw formatted title, legend, and labels
  await waitForMathJax();
  const ctx = radarChart.ctx;

  const titleBlock = radarChart.titleBlock;
  drawFormatted(ctx, cleanTags(titleHTML),
    (titleBlock.left + titleBlock.right) / 2, titleBlock.top + titleBlock.options.padding + 0.125 * fontSize,
    fontSize, "center");

  // Font sizing ends up being different in WebKit-based browsers, so we need to use different alignment here since
  // this is left-aligned and we need to make sure the label is close to the box
  let legendLeftOffset, legendTopOffset;
  if (getWebKitMode()) {
    legendLeftOffset = 0.75 * WEBKIT_FONT_SCALING * fontSize;
    legendTopOffset = 0.125 * WEBKIT_FONT_SCALING * fontSize;
  } else {
    legendLeftOffset = 1.5 * fontSize;
    legendTopOffset = 0;
  }
  const legendHitBox = radarChart.legend.legendHitBoxes[0];
  drawFormatted(ctx, getOutputLabel(),
    legendHitBox.left + legendLeftOffset, legendHitBox.top + legendTopOffset, fontSize, "left");

  const lPointLabelItems = radarChart.scales.r._pointLabelItems;
  for (let i = 0; i < lConditionData.length; ++i) {
    const conditionData = lConditionData[i];
    const labelData = lPointLabelItems[conditionData.displayIndex];
    drawFormatted(ctx, conditionData.labelHTML,
      (labelData.left + labelData.right) / 2, labelData.y + 0.125 * fontSize, fontSize, "center");
  }
}

/**
 * Fill the existing cells with random data
 */
function fillRandom() {

  // Suppress autoUpdating until the end
  const lastAutoUpdating = autoUpdating;
  autoUpdating = false;

  // Fill the condition labels
  for (let i = 0; i < getNumConditions(); ++i) {
    updateQuillContents("#cl-" + i, i + 1);
  }

  // Fill each baseline cell
  const lBaselineInputs = $(".baseline-value");
  for (let k = 0; k < lBaselineInputs.length; ++k) {
    let val = RAND_BASELINE_MIN + Math.random() * (RAND_BASELINE_MAX - RAND_BASELINE_MIN);
    lBaselineInputs[k].value = Math.round(val);
  }

  // Fill each data cell
  const lDataCells = $(".sample-value");
  for (let k = 0; k < lDataCells.length; ++k) {
    let val = VALUE_MIN + Math.random() * (VALUE_MAX - VALUE_MIN);
    lDataCells[k].value = Math.round(val);
  }

  // Make sure the deviation is calculated, even in direct input mode (if not in this mode, it will be calculated when
  // the plot is generated)
  if (directInput) {
    calcDeviation();
  }

  autoUpdating = lastAutoUpdating;
  if (autoUpdating) {
    generatePlot();
  }

}

/**
 * Fill the table with preset example data, from
 * https://onlinelibrary.wiley.com/doi/10.1002/anie.202418239 Table S9
 */
function fillExample() {

  // Suppress autoUpdating until the end
  const lastAutoUpdating = autoUpdating;
  autoUpdating = false;

  setNumDim(OUTPUT, 1);
  setNumDim(CONDITION, 10);
  setNumDim(SAMPLE, 1);

  // Set the title and output label
  $("#title-input .ql-editor p").html("<b>Reaction-condition sensitivity analysis for 1,3-cyclization</b>");
  $(".output-label-select").val("Isolated Yield (%)").change();

  // Fill the condition labels
  updateQuillContents("#cl-0", "High <em>c</em>")
  updateQuillContents("#cl-1", "Low <em>c</em>")
  updateQuillContents("#cl-2", "H<sub>2</sub>O")
  updateQuillContents("#cl-3", "Low O<sub>2</sub>")
  updateQuillContents("#cl-4", "High O<sub>2</sub>")
  updateQuillContents("#cl-5", "Low <em>T</em>")
  updateQuillContents("#cl-6", "High <em>T</em>")
  updateQuillContents("#cl-7", "Low <em>I</em>")
  updateQuillContents("#cl-8", "High <em>I</em>")
  updateQuillContents("#cl-9", "Big scale")

  // Fill the baseline value
  $(".baseline-value").eq(0).val("58");

  // Fill the output values
  const lDataCells = $(".sample-value");
  lDataCells.eq(0).val("48");
  lDataCells.eq(1).val("20");
  lDataCells.eq(2).val("26");
  lDataCells.eq(3).val("49");
  lDataCells.eq(4).val("14");
  lDataCells.eq(5).val("47");
  lDataCells.eq(6).val("40");
  lDataCells.eq(7).val("46");
  lDataCells.eq(8).val("13");
  lDataCells.eq(9).val("50");

  // Clear all tooltips after generating, since clicking the button interferes with the normal trigger to clear its
  // tooltip
  tooltipList.forEach((tooltip) => {
    tooltip.hide();
  });

  // Make sure the deviation is calculated, even in direct input mode (if not in this mode, it will be calculated when
  // the plot is generated)
  if (directInput) {
    calcDeviation();
  }

  autoUpdating = lastAutoUpdating;
  if (autoUpdating) {
    enableAutoUpdates();
  }

}


/**
 * Export the chart in the desired format
 * @param {string} format 
 */
function exportImage(format) {
  $("#glorius-plot")[0].toBlob((blob) => {
    let objectURL = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = objectURL;
    link.download = "glorius_plot." + format;
    link.click();

  }, "image/" + format);
}

function enableCanvasUpdate() {
  $("#width-input").on("change", updateWidth);
  $("#height-input").on("change", updateHeight);
  $("#font-size-input").on("change", updateFontSize);
}

function enableDeviationCalc() {
  // Clear any update triggers first so we don't inadvertently double-up
  disableDeviationCalc();
  $(".trigger-deviation-update").on("change", calcDeviation);
}

function disableDeviationCalc() {
  $(".trigger-deviation-update").off("change");
}

function enableAutoUpdates() {

  // Clear any update triggers first so we don't inadvertently double-up
  disableAutoUpdates();

  // Disable deviation calculation, since that will be handled by the plot generation now
  disableDeviationCalc();

  $(".trigger-chart-update, .trigger-deviation-update").on("change", generatePlot);
  autoUpdating = true;
  updateCanvasShape();
  generatePlot();
}

function enableToggles() {
  $("#input-mode-toggle").on("click", toggleInputMode);
  $("#fan-toggle").on("click", toggleChartMode);

  $("#auto-update-toggle").on("click", toggleAutoUpdates);
}

function enableButtons() {
  $("#fill-random").on("click", fillRandom);
  $("#fill-example").on("click", fillExample);

  $("#generate-plot").on("click", generatePlot);

  $("#export-image-png").on("click", () => exportImage("png"));

  $("#reset-plot-dims").on("click", resetPlotDims);

}

function enableOnChangeTriggers() {

  enableDeviationCalc();
  enableCanvasUpdate();

  $("#dev-plot-select").on("change", setDeviationPlotMode);
  $(".output-label-select").on("change", updateOutputLabelSelection);
  $("#color-select").on("change", updateColourSchemeSelection);
  $(".plot-select").on("change", updatePlotSelect);
}

function disableAutoUpdates() {
  $(".trigger-chart-update").off("change");
  autoUpdating = false;

  // Re-enable any on change triggers aside from chart updating
  enableOnChangeTriggers();
}

function setDeviationPlotMode(e) {
  document.documentElement.setAttribute("dev-calc-mode", e.target.value);
  if (!autoUpdating)
    calcDeviation();
}

function toggleInputMode(e) {
  if ($(e.target).is(":checked")) {

    directInput = true;
    document.documentElement.setAttribute("input-mode", "direct");
    $(".calc-mode-disabled").attr("disabled", false);

  } else {

    directInput = false;
    document.documentElement.setAttribute("input-mode", "calc");
    $(".calc-mode-disabled").attr("disabled", true);
    generatePlot();

  }
}

function toggleChartMode(e) {
  if ($(e.target).is(":checked"))
    document.documentElement.setAttribute("chart-mode", "fan");
  else
    document.documentElement.setAttribute("chart-mode", "radar");
}

function initNumDimControls(dim) {
  $("button.add-" + dim).off("click");
  $("button.remove-" + dim).off("click");
  $("select#num-" + dim).off("change");

  $("button.add-" + dim).on("click", (e) => addDim(dim, e, true));
  $("button.remove-" + dim).on("click", (e) => removeDim(dim, e, true));
  $("select#num-" + dim).on("change", (e) => setNumDim(dim, $(e.target).val()));
}

function updateOutputLabelSelection(e) {
  let targetIndex = getTargetIndex(e, D_DIM_LIMITS.output.max);
  let newValue = this.value;
  let lOutcomeValueCells = $(".output-label-value-cell");
  let outcomeInput = $("#ol-" + targetIndex + " .ql-editor p");

  if (newValue != "Other") {
    lOutcomeValueCells.addClass("hidden");
    outcomeInput.html(newValue);
  } else {
    lOutcomeValueCells.removeClass("hidden");
    outcomeInput.html("");
  }
}

function updateOutputLabel(label) {
  let lOutputHeadings = $(".sample-heading");
  let numSamples = getNumSamples();

  label = cleanTags(label);

  // If only one output, don't number it
  if (numSamples == 1) {
    lOutputHeadings.html(label);
  } else {
    for (let i = 0; i < numSamples; ++i) {
      lOutputHeadings.eq(i).html(label + " " + (i + 1).toString());
    }
  }

  // Update the Mean heading to include the new outcome value
  updateMeanColumn();
}

function updateColourSchemeSelection() {
  let newValue = this.value;
  let customColorInput = $(".color-custom");

  if (newValue != "custom") {
    customColorInput.addClass("hidden");
    $("#min-color-input").val(D_COLOR_SCHEMES[newValue].min);
    $("#max-color-input").val(D_COLOR_SCHEMES[newValue].max);
  } else {
    customColorInput.removeClass("hidden");
  }

  if (autoUpdating)
    generatePlot();
}

/**
 * Outline the desired column depending on the selected plot mode
 */
function updatePlotSelect() {
  const devPlotMode = getDevPlotMode();

  $(".sample-button-cell, .sample-heading .mean-heading, .abs-deviation-heading, " +
    ".rel-deviation-heading").removeClass("col-selected-top");
  $(".sample-heading, .baseline-value-cell, .sample-value-cell, .baseline-mean-cell, .baseline-abs-deviation-cell, " +
    ".baseline-rel-deviation-cell, .mean-value-cell, .abs-deviation-value-cell, " +
    ".rel-deviation-value-cell").removeClass("col-selected");
  $(".plot-select-mean-cell, .plot-select-abs-cell, .plot-select-rel-cell").removeClass("col-selected-bottom");

  if (devPlotMode == "mean") {
    if (getNumSamples() == 1) {
      $(".sample-button-cell").addClass("col-selected-top");
      $(".sample-heading, .baseline-value-cell, .sample-value-cell").addClass("col-selected");
    } else {
      $(".mean-heading").addClass("col-selected-top");
      $(".baseline-mean-cell, .mean-value-cell").addClass("col-selected");
    }
    $(".plot-select-mean-cell").addClass("col-selected-bottom");
  } else if (devPlotMode == "absolute") {
    $(".abs-deviation-heading").addClass("col-selected-top");
    $(".baseline-abs-deviation-cell, .abs-deviation-value-cell").addClass("col-selected");
    $(".plot-select-abs-cell").addClass("col-selected-bottom");
  } else {
    $(".rel-deviation-heading").addClass("col-selected-top");
    $(".baseline-rel-deviation-cell, .rel-deviation-value-cell").addClass("col-selected");
    $(".plot-select-rel-cell").addClass("col-selected-bottom");
  }
}

function toggleAutoUpdates(e) {
  if ($(e.target).is(":checked"))
    enableAutoUpdates();
  else
    disableAutoUpdates();
}

/**
 * Initialize global variables in this script that rely on values in the document
 */
function initGlobals() {
  lastAspectRatio = getAspectRatio();
  lastFontSizeWidthRatio = getFontSizeWidthRatio();
  lastFontSizeHeightRatio = getFontSizeHeightRatio();

  initWidth = getWidth();
  initHeight = getHeight();
  initFontSize = getFontSize();
}

/**
 * Enable all tooltips on the page
 */
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

/**
 * Initialise a Quill editor
 */
function addQuillEditor(selector, placeholder = "", toolbar = QUILL_TOOLBAR) {
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

function removeQuillEditor(selector) {
  delete dQuillEditors[selector];
  $(selector).html("");
}

function updateQuillContents(selector, contents) {
  $(selector + " .ql-editor p").html(contents);
  dQuillEditors[selector].updateContents();
}

function enableQuillToolbar(selector) {
  $(selector).parent().find(".ql-toolbar").addClass("visible");
}

function disableQuillToolbar(selector) {
  $(selector).parent().find(".ql-toolbar").removeClass("visible");
}

function enableQuillEvents() {
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
    editor.on("text-change", () => {
      if (autoUpdating)
        generatePlot();
    });

  });

  // Also set the output label editor to update the output label in column headings when changed
  dQuillEditors["#ol-0"].on("text-change", () => {
    updateOutputLabel(dQuillEditors["#ol-0"].getSemanticHTML());
  });
}

function initQuill() {
  addQuillEditor("#title-input", "“Reaction-condition sensitivity analysis”");
  addQuillEditor("#ol-0", "Define outcome");
  $(".condition-input").each((i, e) => {
    addQuillEditor("#cl-" + i, CONDITION_PLACEHOLDER);
  })
  enableQuillEvents();
}

$(document).ready(function () {

  initTooltips();
  initGlobals();
  initDirtyForms();
  initQuill();

  L_DIMS.forEach(dim => initNumDimControls(dim));

  enableOnChangeTriggers();
  enableToggles();
  enableButtons();

  enableDeviationCalc();

  enableAutoUpdates();

  enableCanvasUpdate();
});
