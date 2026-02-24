/**
 * @file JavaScript code to handle the special functionality of the index.html page
 * @date 2025-08-06
 * @author Bryan Gillis
 */

import { initDirtyForms, cleanDirtyForms, checkIsDirty } from "./dirty-forms.js";
import { mixHexes } from "./color-mixing.js"
import { exportImage, loadObject, makeCsv, saveBlob, saveObject } from "./io.js"
import { clamp, forenameToInitials, getWebKitMode, surnameToCapitalized } from "./utility.js"
import {
  addQuillEditor, getQuillEditor, getQuillEditorHTML, setQuillEditor, removeQuillEditor, updateQuillContents,
  disableQuillToolbar, enableQuillEvents, removeGlobalTags, cleanTags, stripTags, waitForMathJax, drawFormatted,
  incrementRenderBatch, HTMLToMd,
} from "./formatted-labels.js"
import { formatReadmeBibInfo, makeReadme } from "./rocrate/readme.js";
import { formatMetadataBibInfo, makeMetadata } from "./rocrate/metadata.js";
import { makeBaselineDesc } from "./rocrate/baseline.js";
import { makeCondDescTable } from "./rocrate/test-conditions.js";
import { formatESIBibInfo, makeESI } from "./rocrate/esi.js";

const CHART_ID = "glorius-plot", CHART_SELECTOR = `#${CHART_ID}`;

const DIRTY_FORMS_MESSAGE = "Data currently entered in the form will be lost. Do you want to proceed?";

const LABEL_FONT_FAMILY = "'Fira Sans', sans-serif";
const WEBKIT_FONT_SCALING = 8. / 9.;

const CONDITION = "condition", SAMPLE = "sample", L_DIMS = [CONDITION, SAMPLE];

const D_DIM_LIMITS = {
  condition: {
    min: 3,
    max: 12
  },
  sample: {
    min: 1,
    max: 10
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

const CONDITION_PLACEHOLDER = "e.g. “High conc.”";
const CONDITION_DESC_PLACEHOLDER = "Enter description";

const DEFAULT_VALUE_MEAN = 100, VALUE_MIN = 0., VALUE_MAX = 100.;

const RAND_BASELINE_MIN = 60., RAND_BASELINE_MAX = 100.;

const D_DEV_PLOT_MODE_INFO = {
  relative: {
    label: "Deviation (%)",
    key: "rel-deviation",
    beforeOutput: "Deviation of ",
    afterOutput: " from standard conditions (%)",
    stripBegin: null,
    stripEnd: " (%)"
  },
  absolute: {
    label: "Deviation (+/-)",
    key: "abs-deviation",
    beforeOutput: "Deviation of ",
    afterOutput: " from standard conditions (+/-)",
    stripBegin: null,
    stripEnd: " (%)"
  },
  mean: {
    label: "Mean",
    key: "mean",
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
const COLOR_TRANSPARENT = "#FFFFFF00";
const BORDER_WIDTH = 4, L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BASELINE_WIDTH = 4, BASELINE_COLOR = "#FFFFFF";
const DATA_BG_COLOR = [COLOR_TRANSPARENT];
const SHOW_GRID_LINES = true, SHOW_AXIS_LINES = true;
const GRID_WIDTH = 1, GRID_COLOR = "#00000080";
const TIP_SIZE = 3, BASE_SEPARATION = 3;
const BAR_SIZE = 2 * (TIP_SIZE + BASE_SEPARATION + 1);

// Constants related to the RO-crate export section
const BASELINE_DESC_INFO_TEXT = "Add text to describe the experimental conditions that give the REPLACEME you " +
  "reported for the “Standard Conditions” of your chemical process:";

const DEFAULT_DATASET_ABOUT_TEXT = "This dataset enables users to visualise the sensitivity of a given chemical " +
  "transformation to user-defined reaction conditions through the use of a Glorius Plot, based on an original concept " +
  "from the Glorius research group.";

const MIN_NUM_CONTRIBS = 1, MAX_NUM_CONTRIBS = 10;

const D_LICENSE_INFO = {
  "none": {
    name: "",
    id: "",
    url: ""
  },
  "cc0-1.0": {
    name: "Creative Commons Zero v1.0 Universal",
    id: "CC0-1.0",
    url: "https://spdx.org/licenses/CC0-1.0.html"
  },
  "cc-by-4.0": {
    name: "Creative Commons Attribution 4.0 International",
    id: "CC0-1.0",
    url: "https://spdx.org/licenses/CC-BY-4.0.html"
  },
  "cc-by-sa-4.0": {
    name: "Creative Commons Attribution Share Alike 4.0 International",
    id: "CC0-1.0",
    url: "https://spdx.org/licenses/CC-BY-SA-4.0.html"
  },
  "other": {
    name: "",
    id: "",
    url: ""
  }
}

// Structure of the output RO-crate file

const ROCRATE_FILENAME_BASE = "glorius-plot-ro-crate.zip";
const ROCRATE_ROOT_DIR = "glorius-plot/"
const ROCRATE_DATA_DIR = ROCRATE_ROOT_DIR + "data/"
const ROCRATE_PLOT_DIR = ROCRATE_DATA_DIR + "plot/"

// Globals - general
let tooltipList;

// Globals relating to plot generation
let autoUpdating = false, radarChart = null;
let lastAspectRatio, lastLabelFontSizeWidthRatio, lastLabelFontSizeHeightRatio,
  lastAxisFontSizeWidthRatio, lastAxisFontSizeHeightRatio;
let initWidth, initHeight, initLabelFontSize, initAxisFontSize;

// Globals relating to data package export
let roCrateFormUpdating = false;
let exportChecks = {
};

// Stored valued for user-input values to revert to if they click the button to do so
let lastColorVal = "colourblind", lastCustomColorMin = null, lastCustomColorMax = null;
let lastLicenseVal = "none", lastLicenseName = "", lastLicenseUrl = "";
let lastDatasetTitle, lastDatasetDesc, lastDatasetAbout, lastCitation;
let userHasEditedCitation = false;

/**
 * A ChartJS plugin which allows a custom background color for the plot
 */
const customCanvasBackgroundColorPlugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.color || '#FFFFFF';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

/**
 * Get the index value stored at the end of an event's target's ID
 * @param {Event} e The triggering event
 * @param {number} defaultVal The default value to be returned if the triggering event is null
 * @return {number} The index of the triggering event, or else the default value
 */
function getTargetIndex(e, defaultVal = 0) {
  let targetIndex;
  if (e === null) {
    targetIndex = defaultVal;
  } else {
    let eId = e.target.id;
    targetIndex = +(eId.split("-").at(-1));
  }
  return targetIndex
}

function getDimSize(dim) {
  if (dim == CONDITION)
    return getNumConditions();
  else
    return getNumSamples();
}

function getNumConditions() {
  return $(".condition-row").length;
}

function getNumSamples() {
  return $(".sample-heading").length;
}

function addDim(dim, e, updateAfter) {
  if (dim == CONDITION)
    return addConditionRow(e, updateAfter);
  else
    return addSampleCol(e, updateAfter);
}

function removeDim(dim, e, updateAfter) {
  if (dim == CONDITION)
    return removeConditionRow(e, updateAfter);
  else
    return removeSampleCol(e, updateAfter);
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
    $("button.add-" + dim).attr("disabled", true);
  else
    $("button.add-" + dim).removeAttr("disabled");

  if (num <= D_DIM_LIMITS[dim].min)
    $("button.remove-" + dim).attr("disabled", true);
  else
    $("button.remove-" + dim).removeAttr("disabled");
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
    enableNavigation();

    // Also update the plot if desired - we call enableAutoUpdates here to make sure any new inputs have proper triggers
    // set up. This will also then call generatePlot
    if (autoUpdating) {
      enableAutoUpdates();
    }
  }
}

/**
 * Relabel IDs and labels after a dimension is added to the table
 */
function relabelDim(dim) {

  const d = dim[0];
  const num = getDimSize(dim);
  const lButtonCells = $(`.${dim}-button-cell`);
  const lHeadings = $(`.${dim}-heading`);
  const lInputs = $(`.${dim}-input`);

  for (let i = 0; i < num; i++) {
    const sI = i.toString();

    // Fix the IDs of the buttons
    const buttonCell = lButtonCells.eq(i);
    buttonCell.find(".remove-" + dim).attr("id", `remove-${d}b-${sI}`);
    buttonCell.find(".add-" + dim).attr("id", `add-${d}b-${sI}`);

    // Set the heading text if we have any heading cells
    if (lHeadings.length > 0) {
      let headingText = getOutputLabel();
      updateOutputLabel(headingText);
    }

    // Set the label and input text if we have any of those cells
    if (lInputs.length > 0) {
      lInputs.eq(i).attr("id", `${d}l-${sI}`);
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
  const newRow = $(".condition-row").eq(0).clone();
  newRow.find(".condition-input .ql-editor p").html("");
  newRow.find(".sample-value").val("");
  newRow.find(".mean-value").val("100");
  newRow.find(".abs-deviation-value").val("0");
  newRow.find(".rel-deviation-value").val("0");

  // Determine where to add the row based on which button was clicked
  const targetRowIndex = getTargetIndex(e, oldNumConditions - 1);

  if (targetRowIndex >= oldNumConditions - 1)
    $(".sensitivity-table tbody #plot-select-row").before(newRow);
  else
    $(".sensitivity-table tbody .condition-row").eq(targetRowIndex + 1).before(newRow);

  if (updateAfter) {
    // Temporarily disable auto-updating the plot if it's enabled
    const lastAutoUpdating = autoUpdating;
    if (autoUpdating)
      disableAutoUpdates();
    postTableUpdateCleanup("condition", updateAfter);
    if (lastAutoUpdating)
      enableAutoUpdates();
  }
  else {
    // We need to at least relabel the elements so we can clean up Quill editors
    relabelDim("condition");
  }

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = oldNumConditions; i > targetRowIndex + 1; --i) {
    setQuillEditor("#cl-" + i, getQuillEditor("#cl-" + (i - 1)));
    removeQuillEditor("#cl-" + (i - 1));
  }
  $("#cl-" + (targetRowIndex + 1)).html("");
  addQuillEditor("#cl-" + (targetRowIndex + 1), CONDITION_PLACEHOLDER);

  // If we skipped updating the plot before, do it now
  if (updateAfter && autoUpdating)
    generatePlot();

  // If we've started updating the RO-Crate form, add a row to that (which will also update Quill editors events at the
  // end) If not, we call the Quill editors events update here
  if (roCrateFormUpdating) {
    addROCrateCondRow(targetRowIndex);
  } else {
    enableQuillEventsAndCallbacks();
  }

}

function removeConditionRow(e, updateAfter = true) {

  // Check that we don't already have too few rows
  const oldNumConditions = getNumConditions();
  if (oldNumConditions <= D_DIM_LIMITS.condition.min) {
    console.error("Attempt to remove row when minimum rows already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  const targetRowIndex = getTargetIndex(e, oldNumConditions - 1);

  // Remove the Quill editor first, so we don't hit a dangling reference by doing this after removing the row
  removeQuillEditor("#cl-" + targetRowIndex);

  // Remove the row from the table
  $(".sensitivity-table tbody")[0].removeChild($(".condition-row")[targetRowIndex]);

  if (updateAfter) {
    // Temporarily disable auto-updating the plot if it's enabled
    const lastAutoUpdating = autoUpdating;
    if (autoUpdating)
      disableAutoUpdates();
    postTableUpdateCleanup("condition", updateAfter);
    if (lastAutoUpdating)
      enableAutoUpdates();
  }
  else {
    // We need to at least relabel the elements so we can clean up Quill editors
    relabelDim("condition");
  }

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = targetRowIndex; i < oldNumConditions - 1; ++i) {
    setQuillEditor("#cl-" + i, getQuillEditor("#cl-" + (i + 1)))
    removeQuillEditor("#cl-" + (i + 1));
  }

  // If we skipped updating the plot before, do it now
  if (updateAfter && autoUpdating)
    generatePlot();

  // If we've started updating the RO-Crate form, add a row to that (which will also update Quill editors events at the
  // end) If not, we call the Quill editors events update here
  if (roCrateFormUpdating) {
    removeROCrateCondRow(targetRowIndex);
  } else {
    enableQuillEventsAndCallbacks();
  }
}

function addSampleCol(e, updateAfter = true) {

  // Check that we don't already have too many samples
  const numSamples = getNumSamples();
  if (numSamples >= D_DIM_LIMITS.sample.max) {
    console.error("Attempt to add sample when maximum samples already reached");
    return;
  }

  // Determine where to add the column based on which button was clicked
  const targetColIndex = getTargetIndex(e, numSamples - 1);

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
  const targetColIndex = getTargetIndex(e, numSamples - 1);

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

function updateCanvasShape() {
  $(CHART_SELECTOR).css({
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
    $("#label-font-size-input").val(getWidth() * lastLabelFontSizeWidthRatio);
    lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
    $("#axis-font-size-input").val(getWidth() * lastAxisFontSizeWidthRatio);
    lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
  } else {
    lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
    lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
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
    $("#label-font-size-input").val(getHeight() * lastLabelFontSizeHeightRatio);
    lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
    $("#axis-font-size-input").val(getHeight() * lastAxisFontSizeHeightRatio);
    lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
  } else {
    lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
    lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
  }

  if (autoUpdating)
    updateCanvasShape();
}

/**
 * Called when the font size is updated to update the font size scales
 */
function updateFontSize() {
  lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
  lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
  lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
  lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();
}

/**
 * Reset the width, height, and font size to their initial values, and also update globals tracking the ratios
 */
function resetPlotDims() {
  $("#width-input").val(initWidth);
  $("#height-input").val(initHeight);
  $("#label-font-size-input").val(initLabelFontSize);
  $("#axis-font-size-input").val(initAxisFontSize);

  lastAspectRatio = getAspectRatio();
  updateFontSize();

  generateIfUpdating();
}

/**
 * Clear any tooltips currently present on the page
 */
function clearTooltips() {
  tooltipList.forEach((tooltip) => {
    tooltip.hide();
  });
}

// Functions to get various options set by the user, and set them by code

function getTitle() {
  return getQuillEditorHTML("#title-input");
}

function setTitle(val) {
  return updateQuillContents("#title-input", val);
}

function getOutcomeValue() {
  return $("#os-0").val();
}

function setOutcomeValue(val) {
  $("#os-0").val(val);
}

function getOutputLabel() {
  return getQuillEditorHTML("#ol-0");
}

function setOutputLabel(val) {
  updateQuillContents("#ol-0", val);
}

function getFullOutputLabel() {

  // Get the deviation plot mode, and check in case it's mean with only one sample. In that case, use different text
  // for it
  let devPlotMode = getDevPlotMode();
  if (devPlotMode == "mean" && getNumSamples() == 1)
    devPlotMode = "value";

  const dDevPlotModeInfo = D_DEV_PLOT_MODE_INFO[devPlotMode];

  // Get the cleaned output label
  let outputLabel = getOutputLabel();

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

function getConditionLabel(i) {
  return getQuillEditorHTML("#cl-" + i);
}

function setConditionLabel(i, val) {
  updateQuillContents("#cl-" + i, val);
}

function getLConditionLabels() {
  const lCondtionLabelsHTML = [];
  $(".condition-input").each((i) => {
    lCondtionLabelsHTML.push(getConditionLabel(i));
  })
  return lCondtionLabelsHTML;
}

function setLConditionLabels(lVals) {
  for (let i = 0; i < lVals.length; ++i) {
    setConditionLabel(i, lVals[i]);
  }
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

function setDevPlotMode(val) {
  const lPlotSelectRadio = $("input.plot-select");
  lPlotSelectRadio.each(function () {
    const oThis = $(this);
    if (oThis.val() == val)
      oThis.prop("checked", true);
    else
      oThis.prop("checked", false);
  });
}

function getWidth() {
  return +$("#width-input").val();
}

function setWidth(val) {
  $("#width-input").val(val);
}

function getHeight() {
  return +$("#height-input").val();
}

function setHeight(val) {
  $("#height-input").val(val);
}

function getLabelFontSize() {
  return +$("#label-font-size-input").val();
}

function setLabelFontSize(val) {
  $("#label-font-size-input").val(val);
}

function getAxisFontSize() {
  return +$("#axis-font-size-input").val();
}

function setAxisFontSize(val) {
  $("#axis-font-size-input").val(val);
}

function getAspectRatio() {
  return getWidth() / getHeight();
}

function getAspectRatioLock() {
  return $("#lock-aspect-ratio").is(":checked");
}

function setAspectRatioLock(val) {
  $("#lock-aspect-ratio").prop("checked", val);
}

function getLabelFontSizeWidthRatio() {
  return getLabelFontSize() / getWidth();
}

function getLabelFontSizeHeightRatio() {
  return getLabelFontSize() / getHeight();
}

function getAxisFontSizeWidthRatio() {
  return getAxisFontSize() / getWidth();
}

function getAxisFontSizeHeightRatio() {
  return getAxisFontSize() / getHeight();
}

function getFontSizeScaleLock() {
  return $("#scale-font-size").is(":checked");
}

function setFontSizeScaleLock(val) {
  $("#scale-font-size").prop("checked", val);
}

function getMinOutput() {
  if (getDevPlotMode() == "mean")
    return 0;
  let minOutput = $("#min-output-input").val();
  minOutput = clamp(minOutput, -100, -1);
  return minOutput;
}

function setMinOutput(val) {
  $("#min-output-input").val(val);
}

function getMaxOutput() {
  if (getDevPlotMode() == "mean")
    return 100;
  let maxOutput = $("#max-output-input").val();
  maxOutput = clamp(maxOutput, 1, 1000);
  return maxOutput;
}

function setMaxOutput(val) {
  $("#max-output-input").val(val);
}

function getOutputMidpoint() {
  if (getDevPlotMode() != "mean")
    return 0;
  return +($(".baseline-row").find(".mean-value").eq(0).val());
}

function getBandWidth() {
  let bandWidth = $("#band-width-input").val();
  bandWidth = clamp(bandWidth, 1, 1000);
  return bandWidth;
}

function setBandWidth(val) {
  $("#band-width-input").val(val);
}

function getColourScheme() {
  return $("#color-select").val();
}

function setColourScheme(val) {
  $("#color-select").val(val);
}

function getMinColor() {
  return $("#min-color-input").val();
}

function setMinColor(val) {
  $("#min-color-input").val(val);
}

function getMaxColor() {
  return $("#max-color-input").val();
}

function setMaxColor(val) {
  $("#max-color-input").val(val);
}

function getFanMode() {
  return $("#fan-select").val() == "fan";
}

function setFanMode(val) {
  if (val)
    $("#fan-select").val("fan");
  else
    $("#fan-select").val("radar");
}

/**
 * Get how the data should be sorted
 * @returns {int} 1 if ascending, -1 if descending, 0 if as entered
 */
function getDataSorting() {
  return +($("#sort-option").find(":selected").val());
}

function setDataSorting(val) {
  $("#sort-option").val(val);
}

/**
 * Sets tabindex=-1 for all add/remove row buttons so that they'll be skipped over when tabbing within the input table
 */
function disableRowButtonTabs() {
  $("button.remove-condition, button.add-condition").attr("tabindex", "-1");
}

/**
 * Removes tabindex=-1 for all add/remove row buttons so that they'll no longer be skipped over once tabbing outside the
 * input table
 */
function enableRowButtonTabs() {
  $("button.remove-condition, button.add-condition").removeAttr("tabindex");
}

/**
 * When the user presses the Escape key while inputting data, change focus to the add/remove row buttons
 * @param {Object} e 
 */
function navigateToRowButtons(e) {
  const currentCell = $(e.delegateTarget);

  // Find the button we want to change focus to
  const currentRow = currentCell.parent("tr");
  if (currentRow.length != 1)
    return console.error("navigateCell method called on an element whose parent isn't a table row");

  const removeRowButton = currentRow.find("button.remove-condition");
  const addRowButton = currentRow.find("button.add-condition");

  if (!addRowButton && !removeRowButton)
    return;

  // Prioritise moving to the remove row button, unless it's disabled
  let targetButton = removeRowButton;
  if (targetButton.attr("disabled")) {
    targetButton = addRowButton;
  }

  targetButton[0].focus();

  // If we moved away from a Quill editor, disable its toolbar
  const quillEl = currentCell.find(".condition-input");
  if (quillEl) {
    disableQuillToolbar("#" + quillEl.attr("id"));
  }
}

/**
 * When the user presses the Enter key while inputting data, navigate to the next row
 * @param {Object} e The triggering event
 */
function navigateCell(e) {
  const currentCell = $(e.delegateTarget);

  // Get the parent row and table. Strictly, we shouldn't need to filter on the selector, but it will help us catch if
  // something goes wrong here, rather than the error happening somewhere later
  const currentRow = currentCell.parent("tr");
  if (currentRow.length != 1)
    return console.error("navigateCell method called on an element whose parent isn't a table row");
  const parentTable = currentRow.parent("tbody");
  if (parentTable.length != 1)
    return console.error("navigateCell method called in a row whose parent isn't a tbody element");

  // Determine where we are in the table and where we want to be
  const cellIndex = $.inArray(currentCell[0], currentRow.children("td"));
  let newCellIndex = cellIndex;
  const rowIndex = $.inArray(currentRow[0], parentTable.children("tr"));
  let newRowIndex = rowIndex;

  const lRows = parentTable.children("tr");

  const numRows = lRows.length;
  const numCells = currentRow.children("td").length;

  const advanceEnter = function () {
    ++newRowIndex;
    // Check if we're in the last row. If so, loop around to the top row, but next cell. If in the final cell as well,
    // loop around to the first cell
    if (newRowIndex > numRows) {
      newRowIndex = 0;
      ++newCellIndex;
      if (newCellIndex > numCells) {
        newCellIndex = 0;
      }
    }
  }

  const reverseEnter = function () {
    --newRowIndex;
    if (newRowIndex < 0) {
      newRowIndex = numRows - 1;
      --newCellIndex;
      if (newCellIndex < 0) {
        newCellIndex = numCells - 1;
      }
    }
  }

  const noAdvance = function () { }

  // Determine which way to advance based on the key pressed
  let advance = noAdvance;
  if (e.code === "Enter" || e.code === "NumpadEnter") {
    if (e.shiftKey)
      advance = reverseEnter;
    else
      advance = advanceEnter;
  }

  // Advance through the table in the desired direction until we get to a valid input cell
  let foundInput = false;
  while (!foundInput) {
    advance();
    const newRow = lRows.eq(newRowIndex);
    const newCell = newRow.children("td").eq(newCellIndex);

    // Find the descendent of this cell that we want to focus, if it exists
    const eToFocus = newCell.find("input, .ql-editor");
    if (eToFocus.length >= 1 && eToFocus.attr("disabled") != "disabled" && eToFocus.attr("type") != "radio") {
      foundInput = true;
      eToFocus[0].focus();

      // Select all contents in the input, using the Quill API if necessary
      if (eToFocus[0].select) {
        eToFocus[0].select();
      } else {
        const quill = getQuillEditor("#" + eToFocus.parent().attr("id"));
        quill.setSelection(0, quill.getLength());
      }
    }
  }

}

/**
 * Get an object listing all the user preferences, which can be exported to save them
 * @param {boolean} [includeTable=false] 
 * @returns {Object}
 */
function getPlotData() {
  let data = {
    "software-version": version,
    "title": getTitle(),
    "outcome-value": getOutcomeValue(),
    "outcome-text": getOutputLabel(),
    "value-to-plot": getDevPlotMode(),
    "plot-width": getWidth(),
    "plot-height": getHeight(),
    "label-font-size": getLabelFontSize(),
    "axis-font-size": getAxisFontSize(),
    "min-output": getMinOutput(),
    "max-output": getMaxOutput(),
    "band-width": getBandWidth(),
    "fan-display": getFanMode(),
    "color-scheme": getColourScheme(),
    "min-color": getMinColor(),
    "max-color": getMaxColor(),
    "data-arrangement": getDataSorting()
  };
  const numConditions = getNumConditions(), numSamples = getNumSamples();
  const lBaselineCells = $(".baseline-row").find(".baseline-value-cell");
  const lBaselineSamples = [];

  for (let k = 0; k < numSamples; k++) {
    const baselineSampleVal = lBaselineCells.eq(k).find(".baseline-value").val();
    if (baselineSampleVal != "") {
      lBaselineSamples.push(+baselineSampleVal);
    } else {
      lBaselineSamples.push("");
    }
  }

  data["baseline-samples"] = lBaselineSamples;

  data["condition-labels"] = getLConditionLabels();

  const lConditionRows = $(".condition-row");
  const llConditionSamples = [];

  for (let i = 0; i < numConditions; i++) {

    const conditionRow = lConditionRows.eq(i);
    const lConditionCells = conditionRow.find(".sample-value-cell");
    const lConditionSamples = [];
    llConditionSamples.push(lConditionSamples);

    for (let k = 0; k < numSamples; k++) {
      const conditionSampleVal = lConditionCells.eq(k).find(".sample-value").val();
      if (conditionSampleVal != "") {
        lConditionSamples.push(+conditionSampleVal);
      } else {
        lConditionSamples.push("");
      }
    }

  }

  data["condition-samples"] = llConditionSamples;

  return data;
}

function checkPlotDataFile() {
  let lFiles = this.files;
  if (lFiles.length > 0) {
    $("#load-data").removeAttr("disabled");
  } else {
    $("#load-data").attr("disabled", true);
  }
}

async function loadPlotData() {

  // Check if the form is currently dirty, and check with the user before filling if so
  if (checkIsDirty()) {
    if (!confirm(DIRTY_FORMS_MESSAGE)) {
      return;
    }
  }

  loadObject($("#load-data-file")[0].files[0], (data) => {
    // Temporarily disable auto-updating the plot if it's enabled
    const lastAutoUpdating = autoUpdating;
    if (autoUpdating)
      disableAutoUpdates();
    autoUpdating = false;

    setTitle(data["title"]);
    setOutcomeValue(data["outcome-value"]);
    setOutputLabel(data["outcome-text"]);
    setDevPlotMode(data["value-to-plot"]);
    setWidth(data["plot-width"]);
    setHeight(data["plot-height"]);
    setLabelFontSize(data["label-font-size"]);
    setAxisFontSize(data["axis-font-size"]);
    setMinOutput(data["min-output"]);
    setMaxOutput(data["max-output"]);
    setBandWidth(data["band-width"]);
    setFanMode(data["fan-display"]);
    setColourScheme(data["color-scheme"]);
    setMinColor(data["min-color"]);
    setMaxColor(data["max-color"]);
    setDataSorting(data["data-arrangement"]);

    const llSamples = data["condition-samples"];
    const numConditions = llSamples.length;
    const numSamples = llSamples[0].length;
    setNumDim(CONDITION, numConditions);
    setNumDim(SAMPLE, numSamples);

    const lConditionLabels = data["condition-labels"]
    setLConditionLabels(lConditionLabels);

    const lBaselineSamples = data["baseline-samples"];
    const lBaselineCells = $(".baseline-row").find(".baseline-value-cell");

    for (let k = 0; k < numSamples; k++) {
      lBaselineCells.eq(k).find(".baseline-value").val(lBaselineSamples[k]);
    }

    const lConditionRows = $(".condition-row");

    for (let i = 0; i < numConditions; i++) {

      const conditionRow = lConditionRows.eq(i);
      const lConditionCells = conditionRow.find(".sample-value-cell");

      for (let k = 0; k < numSamples; k++) {
        lConditionCells.eq(k).find(".sample-value").val(llSamples[i][k]);
      }

    }

    if (lastAutoUpdating)
      enableAutoUpdates();

    cleanDirtyForms();
  })
}

/**
 * Given the full plot data, make a stringified CSV table of the sensitivity information
 * @param {Object} plotData 
 * @param {Boolean} clean If true, will remove the plot data from the input object 
 * @returns {String}
 */
function makeSensitivityTable(plotData, clean = false) {

  const lBaselineSamples = plotData["baseline-samples"];
  const lConditionLabels = plotData["condition-labels"];
  const llConditionSamples = plotData["condition-samples"];

  const numSamples = lBaselineSamples.length;
  const numConditions = lConditionLabels.length;

  const devPlotMode = getDevPlotMode();
  const includeDev = !(devPlotMode == "mean" && numSamples == 1);
  const lDevValueInputs = $(`input.${D_DEV_PLOT_MODE_INFO[devPlotMode].key}-value`);

  // Start the output array
  const lRows = [];
  const headerRow = ["Test parameter"];
  const outputLabel = getOutputLabel();
  if (numSamples == 1) {
    headerRow.push(outputLabel);
  } else {
    for (let j = 0; j < numSamples; ++j) {

      headerRow.push(`${outputLabel} ${j + 1}`);
    }
  }
  if (includeDev)
    headerRow.push(D_DEV_PLOT_MODE_INFO[getDevPlotMode()].label);
  lRows.push(headerRow);

  // Add the baseline row
  const baselineRow = ["Standard Conditions"];
  lBaselineSamples.forEach((s) => baselineRow.push(s));
  baselineRow.push("");
  lRows.push(baselineRow);

  // Add a row for each condition
  for (let i = 0; i < numConditions; ++i) {
    const newRow = []
    newRow.push(lConditionLabels[i]);
    llConditionSamples[i].forEach((s) => newRow.push(s));
    if (includeDev)
      newRow.push(lDevValueInputs[i].value);
    lRows.push(newRow);
  }

  // Remove this data from the input object if desired
  if (clean) {
    delete plotData["baseline-samples"];
    delete plotData["condition-labels"];
    delete plotData["condition-samples"];
  }

  return {
    arr: lRows,
    csv: makeCsv(lRows)
  };
}

/**
 * Calculate the deviation for each condition
 */
function calcDeviation() {
  const numConditions = getNumConditions(), numOutputs = 1, numSamples = getNumSamples();

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

  // Increment the render batch, so text from previous renders won't load, and store the value of the previous batch
  let renderBatch = incrementRenderBatch();

  // Ensure deviation is calculated first
  calcDeviation();

  // Collect info from the settings and determine data based on them
  const numConditions = getNumConditions(), numOutputs = 1;

  const minOutput = getMinOutput(), maxOutput = getMaxOutput(), outputMidpoint = getOutputMidpoint();
  const bandWidth = getBandWidth();

  const fanMode = getFanMode();

  const minColor = getMinColor(), maxColor = getMaxColor();

  const numAnglePoints = numConditions * BAR_SIZE;

  // Create data we'll plot in the chart
  const llData = [];
  const lOutputLabels = [];
  const lOrder = [];
  const lBorderColors = [], lBorderWidths = [];
  const lBackgroundColors = [], lFill = [];
  const lBorderDashes = [];

  let numAxisLines;
  let numBgColorsLow, numBgColorsHi, numBgColors;
  let numDatasetMultiplier;


  // If in radar mode, we make some fake data to use as background colors and grid lines

  if (fanMode) {
    numAxisLines = numBgColorsLow = numBgColorsHi = numBgColors = 0;
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
  lBorderColors.push(BASELINE_COLOR), lBorderDashes.push([]);
  lBackgroundColors.push(BASELINE_COLOR), lFill.push(false);

  if (fanMode)
    lBorderWidths.push(0);
  else
    lBorderWidths.push(BASELINE_WIDTH);

  if (!fanMode) {

    // Make fake data for each background color

    const numLowBands = Math.ceil((outputMidpoint - minOutput) / bandWidth);
    const numHiBands = Math.ceil((maxOutput - outputMidpoint) / bandWidth);

    numBgColorsLow = numLowBands, numBgColorsHi = numHiBands + 1;
    numBgColors = numBgColorsLow + numBgColorsHi;

    numDatasetMultiplier = 1;

    const lBgColorBoundsLow = [], lBgOrderLow = [];
    for (let i = 0; i < numBgColorsLow; ++i) {
      lBgColorBoundsLow.push(Math.max(outputMidpoint - bandWidth * (i + 1), minOutput));
      lBgOrderLow.push(i + 1);
    }

    const lBgColorBoundsHi = [], lBgOrderHi = [];
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
      let backgroundColor = mixHexes(maxColor, "#FFFFFF", colorRatio);
      lBackgroundColors.push(backgroundColor), lFill.push(0);

      if (SHOW_GRID_LINES)
        lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH);
      else
        lBorderColors.push(backgroundColor), lBorderWidths.push(0);

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
      let backgroundColor = mixHexes(minColor, "#FFFFFF", colorRatio);
      lBackgroundColors.push(backgroundColor), lFill.push(0);

      if (SHOW_GRID_LINES)
        lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH);
      else
        lBorderColors.push(backgroundColor), lBorderWidths.push(0);
      lBorderDashes.push([]);
    }

    // Make fake data for each axis line we want to draw if desired
    if (SHOW_AXIS_LINES) {
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
        lBorderColors.push(GRID_COLOR), lBorderWidths.push(GRID_WIDTH), lBorderDashes.push([]);
        lBackgroundColors.push(DATA_BG_COLOR), lFill.push(false);
      }
    } else {
      numAxisLines = 0;
    }
  }

  const lConditionLabels = getLConditionLabels();

  // Make a fake dataset to add the label to the legend for each output
  const devPlotMode = getDevPlotMode();

  for (let j = 0; j < numOutputs; ++j) {

    lOutputLabels.push(stripTags(getFullOutputLabel()));

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
    lBorderColors.push("black"), lBorderWidths.push(BORDER_WIDTH), lBorderDashes.push(L_BORDER_DASHES[j]);
    lBackgroundColors.push("white"), lFill.push(false);
  }

  // Get data for each output
  for (let j = 0; j < numOutputs * numDatasetMultiplier; ++j) {
    llData.push([]);
  }

  const lSensRows = $(".condition-row");
  const lConditionData = [];
  for (let i = 0; i < numConditions; ++i) {
    let lSingleConditionData = [];

    const devPlotModeKey = D_DEV_PLOT_MODE_INFO[devPlotMode].key;
    const lCells = lSensRows.eq(i).find(`.${devPlotModeKey}-value-cell`);
    const lInputs = lCells.eq(0).find(`input.${devPlotModeKey}-value`);

    for (let j = 0; j < numOutputs; ++j) {
      lSingleConditionData.push(lInputs[j].value);
    }
    lConditionData.push({
      label: stripTags(lConditionLabels[i]),
      labelHTML: lConditionLabels[i],
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
        const tipCenter = BAR_SIZE * (i + 0.5 + 0.5 * j / numOutputs);

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
          if (tipDistance <= TIP_SIZE)
            lData.push(clamp(conditionData.data[j], minOutput, maxOutput));
          else if (tipDistance <= TIP_SIZE + 1)
            lData.push(outputMidpoint);
          else if (j == 0 && tipDistance <= TIP_SIZE + BASE_SEPARATION + 1)
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
      lBorderColors.push("black"), lBorderWidths.push(BORDER_WIDTH), lBorderDashes.push(L_BORDER_DASHES[j]);

      if (fanMode) {
        let color;
        let clampedVal = clamp(lConditionData[i].data[j], minOutput, maxOutput);
        if (clampedVal >= outputMidpoint) {
          if (maxOutput == outputMidpoint) {
            color = maxColor;
          } else {
            let colorRatio = (clampedVal - outputMidpoint) / (maxOutput - outputMidpoint);
            color = mixHexes(maxColor, "#FFFFFF", colorRatio);
          }
        }
        else {
          if (minOutput == outputMidpoint) {
            color = minColor;
          } else {
            let colorRatio = (outputMidpoint - clampedVal) / (outputMidpoint - minOutput);
            color = mixHexes(minColor, "#FFFFFF", colorRatio);
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
  const labelFontSize = getLabelFontSize();
  let alignmentFontSize = labelFontSize;
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
      font: {
        family: LABEL_FONT_FAMILY,
        size: getAxisFontSize()
      }
    }
  };

  const plotLegendOptions = {
    position: "bottom",
    labels: {
      boxHeight: alignmentFontSize,
      boxWidth: alignmentFontSize,
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
    radarChart = new Chart(CHART_ID, {
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
            color: "#FFFFFF",
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
  drawFormatted(ctx, titleHTML,
    (titleBlock.left + titleBlock.right) / 2, titleBlock.top + titleBlock.options.padding + 0.125 * labelFontSize,
    labelFontSize, "center", renderBatch);

  // Font sizing ends up being different in WebKit-based browsers, so we need to use different alignment here since
  // this is left-aligned and we need to make sure the label is close to the box
  let legendLeftOffset, legendTopOffset;
  const legendHitBox = radarChart.legend.legendHitBoxes[0];
  if (legendHitBox) {
    if (getWebKitMode()) {
      legendLeftOffset = 1.5 * alignmentFontSize - 0.0325 * legendHitBox.width;
      legendTopOffset = 0.05 * alignmentFontSize;
    } else {
      legendLeftOffset = 1.5 * labelFontSize;
      legendTopOffset = 0;
    }
    drawFormatted(ctx, getFullOutputLabel(),
      legendHitBox.left + legendLeftOffset, legendHitBox.top + legendTopOffset, labelFontSize, "left", renderBatch);
  }

  const lPointLabelItems = radarChart.scales.r._pointLabelItems;
  for (let i = 0; i < lConditionData.length; ++i) {
    const conditionData = lConditionData[i];
    const labelData = lPointLabelItems[conditionData.displayIndex];
    drawFormatted(ctx, conditionData.labelHTML,
      (labelData.left + labelData.right) / 2, labelData.y + 0.125 * labelFontSize, labelFontSize, "center",
      renderBatch);
  }
}

/**
 * Convenience function to generate a new plot only if auto updating is turned on
 */
function generateIfUpdating() {
  if (autoUpdating)
    generatePlot();
}

/**
 * Fill the existing cells with random data
 */
function fillRandom() {

  // Check if the form is currently dirty, and check with the user before filling if so
  if (checkIsDirty()) {
    if (!confirm(DIRTY_FORMS_MESSAGE)) {
      return;
    }
  }

  // Suppress autoUpdating until the end
  const lastAutoUpdating = autoUpdating;
  if (autoUpdating)
    disableAutoUpdates();

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

  if (lastAutoUpdating)
    enableAutoUpdates();

  // Set the current state of the form as "clean"
  cleanDirtyForms();
}

/**
 * Fill the table with preset example data, from
 * https://onlinelibrary.wiley.com/doi/10.1002/anie.202418239 Table S9
 */
function fillExample() {

  // Check if the form is currently dirty, and check with the user before filling if so
  if (checkIsDirty()) {
    if (!confirm(DIRTY_FORMS_MESSAGE)) {
      setTimeout(clearTooltips, 100);
      return;
    }
  }

  // Suppress autoUpdating until the end
  const lastAutoUpdating = autoUpdating;
  if (autoUpdating)
    disableAutoUpdates();

  setNumDim(CONDITION, 10), setNumDim(SAMPLE, 1);

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

  // Make sure the deviation is calculated, even in direct input mode (if not in this mode, it will be calculated when
  // the plot is generated)
  calcDeviation();

  if (lastAutoUpdating)
    enableAutoUpdates();

  // Set the current state of the form as "clean"
  cleanDirtyForms();

  // Clear all tooltips after generating, since clicking the button interferes with the normal trigger to clear its
  // tooltip. This needs to be delayed slightly since after clicking the alert, the tooltip handler things the mouse
  // will still be over the button
  setTimeout(clearTooltips, 100);
}

/**
 * Scroll to a section on the page and update the URL to point to it
 * @param {String} selector 
 */
function scrollToSection(selector) {
  $(selector)[0].scrollIntoView({ behavior: 'smooth' });
  window.history.pushState({}, "", selector);
}

// Functions related to RO-crate data package export

/**
 * Display the RO-crate export sections, scroll to the top of them, and show/adjust buttons to return to them
 */
function startROCrateExport(scroll = true) {
  $(".hidden-after-rocrate").addClass("hidden");
  $(".hidden-until-rocrate").removeClass("hidden");
  $(".rocrate-export").removeClass("hidden");

  // Flag that we'll now want to start updating the RO-crate form, and do so now
  roCrateFormUpdating = true;
  updateROCrateForm(true);

  if (scroll)
    scrollToSection("#rocrate-export-title");
}

async function updateROCrateForm(firstTime = false) {

  updateROCrateOutputLabel();

  // The first time the form is updated only, set the title/about and citation sections based on what's in the form
  // above, and do other initialisation tasks
  if (firstTime) {
    initCondDescs();
    enableQuillEventsAndCallbacks();
    useDefaultROCrateTitleDesc();
    // Update citation after a bit of a lag, since it depends on the title
    setTimeout(useDefaultCitation, 100);
  }
}

/**
 * Update the description text for the standard conditions description box
 */
function updateROCrateOutputLabel() {
  // To save processing, this only starts being updated after the user first reveals the export section
  if (!roCrateFormUpdating)
    return;

  // If it's one of the built-in labels, make it lowercase. Don't if it's Custom, since we don't know if it's
  // case-sensitive or not and it's better to play it safe
  let outputLabel = getOutputLabel();
  if ($(".output-label-select").val() != "Other")
    outputLabel = outputLabel.toLowerCase();
  else if (outputLabel == "")
    outputLabel = "outcome";

  $("label[for=\"baseline-desc-container\"]").html(BASELINE_DESC_INFO_TEXT.replace("REPLACEME", outputLabel));
}

/**
 * Initialise the form to fill in descriptions for each condition
 */
function initCondDescs() {

  // First make sure we have the right number of rows by adding or removing as necessary
  const numRows = getNumConditions();
  setNumROCrateCondRow(numRows);

  // Update the condition labels to match the user input
  for (let i = 0; i < numRows; ++i) {
    updateCondDescLabel(i);
  }

}

function addROCrateCondRow(targetRowIndex = -1, updateAfter = true) {
  const descTable = $("#rocrate-cond-desc-table>tbody");
  const newRow = $(".rocrate-cond-row").eq(0).clone();
  newRow.find(".rocrate-cond-desc-label").html(":")
  newRow.find(".rocrate-cond-desc-input .ql-editor").html("");

  if (targetRowIndex == -1) {
    targetRowIndex = descTable.find("tr").length - 1;
    descTable.append(newRow);
  } else {
    descTable.find("tr").eq(targetRowIndex).after(newRow);
  }

  // Update IDs to match the new row indices
  relabelCondDesc();

  const newNumConditions = $(".rocrate-cond-row").length;

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = newNumConditions - 1; i > targetRowIndex + 1; --i) {
    setQuillEditor("#rcdi-" + i, getQuillEditor("#rcdi-" + (i - 1)));
    removeQuillEditor("#rcdi-" + (i - 1));
  }
  addQuillEditor("#rcdi-" + (targetRowIndex + 1), CONDITION_DESC_PLACEHOLDER);

  if (updateAfter)
    enableQuillEventsAndCallbacks();
}

function removeROCrateCondRow(targetRowIndex = -1, updateAfter = true) {
  const descTable = $("#rocrate-cond-desc-table>tbody");
  const lRows = descTable.find("tr");
  const oldNumConditions = lRows.length;

  if (targetRowIndex == -1) {
    targetRowIndex = oldNumConditions - 1;
  }

  // Remove the Quill editor first, so we don't hit a dangling reference by doing this after removing the row
  removeQuillEditor("#rcdi-" + targetRowIndex);

  // Remove the row from the table
  lRows.eq(targetRowIndex).remove();

  // Update IDs to match the new row indices
  relabelCondDesc();

  // Clean up the Quill dict to point to the moved positions of the editors, and add an editor for the new row
  for (let i = targetRowIndex; i < oldNumConditions - 1; ++i) {
    setQuillEditor("#rcdi-" + i, getQuillEditor("#rcdi-" + (i + 1)))
    removeQuillEditor("#rcdi-" + (i + 1));
  }

  if (updateAfter)
    enableQuillEventsAndCallbacks();
}

function setNumROCrateCondRow(num) {
  const oldNum = $("#rocrate-cond-desc-table tr").length;

  if (oldNum < num) {
    for (let i = 0; i < num - oldNum; ++i) {
      addROCrateCondRow(-1, false);
    }
  } else if (oldNum > num) {
    for (let i = 0; i < oldNum - num; ++i) {
      removeROCrateCondRow(-1, false);
    }
  } else {
    return;
  }
  enableQuillEventsAndCallbacks();
}

/**
 * Relabel all condition description labels to match the conditions as input by the user
 */
function relabelCondDesc() {

  const num = $(".rocrate-cond-row").length;
  const lLabels = $(".rocrate-cond-desc-label");
  const lDescs = $(".rocrate-cond-desc-input");

  for (let i = 0; i < num; i++) {
    // Fix the IDs of the labels and description inputs
    lLabels.eq(i).attr("id", `rcdl-${i}`);
    lDescs.eq(i).attr("id", `rcdi-${i}`);
  }

}

/**
 * Get the number of contributor rows currently in the contributor table
 * @returns {int}
 */
function getNumContribs() {
  return $(".rocrate-contrib-row").length;
}

function addROCrateContribRow(e, updateAfter = true) {
  const newRow = $(".rocrate-contrib-row").eq(0).clone();
  newRow.find(".rocrate-name-input").val("");
  newRow.find(".rocrate-orcid-input").val("");

  const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);

  $(".rocrate-contrib-row").eq(targetRowIndex).after(newRow);

  // Update IDs to match the new row indices
  relabelContribs();

  if (updateAfter)
    postContribRowUpdate();
}

function removeROCrateContribRow(e, updateAfter = true) {
  const lRows = $("..rocrate-contrib-row");
  const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);

  // Remove the row from the table
  lRows.eq(targetRowIndex).remove();

  // Update IDs to match the new row indices
  relabelContribs();

  if (updateAfter)
    postContribRowUpdate();
}

function setNumROCrateContribRow(e) {
  const oldNum = getNumContribs();
  const num = +($(e.target).find(":selected").val());

  if (oldNum < num) {
    for (let i = 0; i < num - oldNum; ++i) {
      addROCrateContribRow(null, false);
    }
  } else if (oldNum > num) {
    for (let i = 0; i < oldNum - num; ++i) {
      removeROCrateContribRow(null, false);
    }
  } else {
    return;
  }
  postContribRowUpdate();
}

/**
 * Open a search for the entered author name on the ORCID site
 * @param {Event} e 
 */
function lookupOrcid(e) {
  const targetRowIndex = getTargetIndex(e, getNumContribs() - 1);
  const targetRow = $(".rocrate-contrib-row").eq(targetRowIndex);
  const authorName = targetRow.find(".rocrate-name-input").val();

  // Construct the URL to use for the search on ORCID's site and open it in a new tab
  const lookupUrl = `https://orcid.org/orcid-search/search?searchQuery=${authorName.replace(" ", "%20")}`
  window.open(lookupUrl, '_blank').focus();
}

/**
 * Fix the IDs of all contributor inputs
 */
function relabelContribs() {

  const num = getNumContribs();
  const lRemoveButtons = $(".remove-contrib");
  const lAddButtons = $(".add-contrib");
  const lNameLabels = $(".rocrate-name-label");
  const lNameInputs = $(".rocrate-name-input");
  const lOrcidButtons = $(".rocrate-orcid-lookup");
  const lOrcidLabels = $(".rocrate-orcid-label");
  const lOrcidInputs = $(".rocrate-orcid-input");

  for (let i = 0; i < num; i++) {
    // Fix the IDs of the labels and inputs
    lRemoveButtons.eq(i).attr("id", `remove-rcb-${i}`);
    lAddButtons.eq(i).attr("id", `add-rcb-${i}`);
    lNameLabels.eq(i).attr("id", `rnl-${i}`);
    lNameInputs.eq(i).attr("id", `rni-${i}`);
    lOrcidButtons.eq(i).attr("id", `rob-${i}`);
    lOrcidLabels.eq(i).attr("id", `rol-${i}`);
    lOrcidInputs.eq(i).attr("id", `roi-${i}`);
  }
}

function postContribRowUpdate() {

  const lAddContribButtons = $("button.add-contrib");
  const lRemoveContribButtons = $("button.remove-contrib");
  const lOrcidLookupButtons = $("button.rocrate-orcid-lookup");

  // Make sure all buttons have the proper events set
  lAddContribButtons.off("click");
  lRemoveContribButtons.off("click");
  lOrcidLookupButtons.off("click");

  lAddContribButtons.on("click", addROCrateContribRow);
  lRemoveContribButtons.on("click", removeROCrateContribRow);
  lOrcidLookupButtons.on("click", lookupOrcid);

  // Enable/disable buttons as appropriate depending on if we're at the min, max, or neither
  const numContribs = getNumContribs();
  if (numContribs >= MAX_NUM_CONTRIBS)
    lAddContribButtons.attr("disabled", true);
  else
    lAddContribButtons.removeAttr("disabled");
  if (numContribs <= MIN_NUM_CONTRIBS)
    lRemoveContribButtons.attr("disabled", true);
  else
    lRemoveContribButtons.removeAttr("disabled");

  // Enable on change triggers for each name input
  for (let i = 0; i < numContribs; ++i) {
    const e = $("#rni-" + i);
    e.off("change");
    e.on("change", () => {
      if (!userHasEditedCitation)
        useDefaultCitation();
    });
  }
}

/**
 * Update the label for a given condition description to match the condition as input by the user
 * @param {Number} i The index of the condition (row)
 */
function updateCondDescLabel(i) {
  $("#rcdl-" + i).html(getConditionLabel(i) + ":");
}

/**
 * Sets the title, description, and about in the RO-crate section to defaults
 */
function useDefaultROCrateTitleDesc(e) {

  // If this isn't the initialisation call (which will be the case if event info from a button click is passed here),
  // store the previous title, description, and about text
  if (e) {
    lastDatasetTitle = getQuillEditorHTML("#rocrate-title-input");
    lastDatasetDesc = getQuillEditorHTML("#rocrate-desc-input");
    lastDatasetAbout = getQuillEditorHTML("#rocrate-about");
    $("#rocrate-revert-title-desc").removeAttr("disabled");
  }

  const title = removeGlobalTags(getTitle());
  updateQuillContents("#rocrate-title-input", title);
  updateQuillContents("#rocrate-desc-input", title + " dataset generated by PSDI Glorius Plot Generator");
  updateQuillContents("#rocrate-about", DEFAULT_DATASET_ABOUT_TEXT);
}

/**
 * Reverts the text in the title, description, and about inputs in the RO-crate section to what they were before the
 * last click of the Default or Revert button
 */
function revertROCrateTitleDesc() {
  // Swap the values in the inputs and the stored values
  let tempDatasetTitle = getQuillEditorHTML("#rocrate-title-input");
  let tempDatasetDesc = getQuillEditorHTML("#rocrate-desc-input");
  let tempDatasetAbout = getQuillEditorHTML("#rocrate-about");

  updateQuillContents("#rocrate-title-input", lastDatasetTitle);
  updateQuillContents("#rocrate-desc-input", lastDatasetDesc);
  updateQuillContents("#rocrate-about", lastDatasetAbout);

  lastDatasetTitle = tempDatasetTitle;
  lastDatasetDesc = tempDatasetDesc;
  lastDatasetAbout = tempDatasetAbout;
}

function useDefaultCitation(e) {

  // If this isn't the initialisation call (which will be the case if event info from a button click is passed here),
  // store the previous citation
  if (e) {
    lastCitation = getQuillEditorHTML("#rocrate-citation");
    userHasEditedCitation = false;
    $("#rocrate-revert-citation").removeAttr("disabled");
  }
  const datasetTitle = getQuillEditorHTML("#rocrate-title-input")
  const date = (new Date()).toISOString().slice(0, 9);

  const lNames = [];
  $(".rocrate-name-input").each((_, nameInput) => {
    let name = nameInput.value;

    // Take a best guess at formatting the name as surname, forename
    const lNameSegments = name.split(/\s+/u);
    let formattedName;
    if (!lNameSegments[0]) {
      return;
    } else if (lNameSegments.length == 1) {
      formattedName = name;
    } else {

      // Check if we can split by a comma, in which case surname is before, forename after
      const lCommaSplitSegments = name.split(/,\s+/u);
      if (lCommaSplitSegments.length == 2) {
        formattedName = `${lCommaSplitSegments[0]}, ${forenameToInitials(lCommaSplitSegments[1])}`;
      } else {

        // We either have zero commas, or more than one, so they aren't a good guide. If more than one, strip them all
        if (lCommaSplitSegments.length > 2) {
          lNameSegments.forEach((s, i) => {
            lNameSegments[i] = s.replace(",", "");
          });
        }

        // Now, let's check if the surname segments are indicated by being in all-caps
        const lCapsSurnameSegments = [];
        const lCapsForenameSegments = [];
        lNameSegments.forEach((s) => {
          if (s.length > 1 && s === s.toUpperCase()) {
            lCapsSurnameSegments.push(s);
          } else {
            lCapsForenameSegments.push(s);
          }
        });

        if (lCapsSurnameSegments.length > 0) {
          // Turn the all-caps segments into just the first letter capitalised
          lCapsSurnameSegments.forEach((s, i) => {
            lCapsSurnameSegments[i] = surnameToCapitalized(s);
          });
          formattedName = `${lCapsSurnameSegments.join(" ")}, ${forenameToInitials(lCapsForenameSegments.join(" "))}`;
        } else {
          // If we get here, there's no obvious indications of what's the forename and what's the surname, so we'll
          // take the best guess that only the final segment is the surname, which is the most-likely scenario for a
          // site aimed at British users like this one
          formattedName = `${lNameSegments.at(-1)}, ${forenameToInitials(lNameSegments.slice(0, -1).join(" "))}`;
        }
      }
    }

    lNames.push(formattedName);
  });

  // Format differently depending on if we have, none, one, two, or three or more authors
  let authorList;
  if (lNames.length == 0) {
    authorList = "";
  } else if (lNames.length == 1) {
    authorList = lNames[0];
  } else if (lNames.length == 2) {
    authorList = lNames[0];
    authorList = `${lNames[0]}; and ${lNames[1]}`;
  } else {
    authorList = "";
    for (let i = 0; i < lNames.length; ++i) {
      if (i < lNames.length - 1)
        authorList += `${lNames[i]}; `;
      else
        authorList += `and ${lNames[i]}`;
    }
  }

  if (authorList.length > 0 && authorList.at(-1) == ".") {
    authorList += " ";
  } else if (authorList.length > 0) {
    authorList += ". ";
  }

  const citation = `Please cite: <em>${authorList}</em>${datasetTitle} generated by PSDI Glorius Plot Generator ` +
    `version ${version} (${date}).`;

  const lastUserHasEditedCitation = userHasEditedCitation;
  updateQuillContents("#rocrate-citation", citation);
  if (e) {
    userHasEditedCitation = false;
  } else {
    userHasEditedCitation = lastUserHasEditedCitation;
  }
}

/**
 * Reverts the text in the citation in the RO-crate section to what it was before the
 * last click of the Default or Revert button
 */
function revertCitation() {
  // Swap the values in the inputs and the stored values
  let tempCitation = getQuillEditorHTML("#rocrate-citation");
  updateQuillContents("#rocrate-citation", lastCitation);
  lastCitation = tempCitation;

  userHasEditedCitation = true;
}

/**
 * Called when the license radio input is changed to update the values in the input boxes and set them as disabled or
 * not-disabled based on whether or not the "Other" option is selected
 */
function updateLicense() {
  const licenseNameInput = $("#rocrate-license-name");
  const licenseUrlInput = $("#rocrate-license-url");

  // Determine which license is selected and get the info on it
  const license = $("input[name='rocrate-license']:checked").val();
  const licenseInfo = D_LICENSE_INFO[license];

  // If switching from Other to a different license, store the entered values
  if (lastLicenseVal === "other" && license !== "other") {
    lastLicenseName = licenseNameInput.val();
    lastLicenseUrl = licenseUrlInput.val();
  }

  // Update the name and URL displayed
  if (license === "other") {
    licenseNameInput.val(lastLicenseName);
    licenseUrlInput.val(lastLicenseUrl);
  } else {
    licenseNameInput.val(licenseInfo.name);
    licenseUrlInput.val(licenseInfo.url);
  }

  // Update the last license value for the next time this function is called
  lastLicenseVal = license;

  // Determine whether or not to disable the license name and URL input based on whether or not the Other option is
  // selected
  if (license === "other") {
    licenseNameInput.removeAttr("disabled");
    licenseUrlInput.removeAttr("disabled");
    licenseNameInput.focus();
  } else {
    licenseNameInput.attr("disabled", true);
    licenseUrlInput.attr("disabled", true);
  }

}

/**
 * Get the name and URL of the selected license
 * @returns {Object} The license info, in name and url attributes
 */
function getLicenseInfo() {
  return {
    name: $("#rocrate-license-name").val(),
    url: $("#rocrate-license-url").val()
  };
}

/**
 * Get whether or not a reaction scheme is provided
 * @returns {Boolean}
 */
function reactionSchemePresent() {
  return !!$("#rocrate-cdxml").val();
}

/**
 * Check if a reaction scheme is uploaded. If so, display it in the File Structure section
 */
function updateReactionScheme() {
  if (reactionSchemePresent())
    $("#rocrate-reaction-scheme-li").removeClass("hidden");
  else
    $("#rocrate-reaction-scheme-li").addClass("hidden");
}

/**
 * Get the reaction scheme file uploaded by the user
 * @returns {File}
 */
function getReactionScheme() {
  return $("#rocrate-cdxml")[0].files[0];
}

/**
 * Get whether or not a reaction scheme image is provided
 * @returns {Boolean}
 */
function reactionSchemeImgPresent() {
  return !!$("#rocrate-img").val();
}

/**
 * Get the reaction scheme file uploaded by the user
 * @returns {File}
 */
function getReactionSchemeImg() {
  return $("#rocrate-img")[0].files[0];
}

/**
 * Get the user-provided Baseline description
 * @returns {String}
 */
function getBaselineDesc() {
  return getQuillEditorHTML("#rocrate-baseline-desc", false);
}

/**
 * Get whether or not a baseline description is provided
 * @returns {Boolean}
 */
function baselineDescPresent() {
  return !!cleanTags(getBaselineDesc());
}

/**
 * Check if any text has been entered for the Standard Conditions description, and display it in the File Structure
 * section if so
 */
function checkBaselineDesc() {
  if (baselineDescPresent())
    $("#rocrate-baseline-li").removeClass("hidden");
  else
    $("#rocrate-baseline-li").addClass("hidden");
}

/**
 * Gets a list of the conditions and user-provided descriptions
 * @returns {Array<Array<string>>} List of two element pairs, where the first is the condition label, and the
 *                                 second is the condition description
 */
function getCondDescs() {
  const numConditions = getNumConditions();
  let lCondDescs = [];
  for (let i = 0; i < numConditions; ++i) {
    lCondDescs.push([getConditionLabel(i), getQuillEditorHTML("#rcdi-" + i)]);
  }
  return lCondDescs;
}

/**
 * Get whether or not a description is provided for at least one condition
 * @returns {Boolean}
 */
function condDescsPresent() {
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; ++i) {
    if (getQuillEditorHTML("#rcdi-" + i))
      return true;
  }
  return false;
}

/**
 * Check if a description has been provided for any of the conditions, and display the file for it in the File Structure
 * section if so
 */
function checkCondDescs() {
  if (condDescsPresent())
    $("#rocrate-test-conditions-li").removeClass("hidden");
  else
    $("#rocrate-test-conditions-li").addClass("hidden");
}

function updateROCrateDownloadEnabled() {
  let allGood = true;
  Object.values(exportChecks).forEach((check) => {
    if (!check)
      allGood = false;
  });
  if (allGood || debug)
    $("#rocrate-download").removeAttr("disabled");
  else
    $("#rocrate-download").attr("disabled", true);
}

function makeTextVersions(textHTML) {
  return {
    html: textHTML,
    md: HTMLToMd(cleanTags(textHTML)),
    txt: stripTags(textHTML)
  };
}

/**
 * Create an RO-crate with all provided data and provide it to the user for download
 */
async function exportROCrate() {

  // Set up a rocrateInfo object containing all info that will be needed to construct the various files in the rocrate

  // plotData will be modified when the Sensitivity Table is created to remove redundant information in it, so we create
  // it as a separate variable here outside the rocrateInfo object so we can do so
  const plotData = getPlotData();

  const rocrateInfo = {
    title: makeTextVersions(getQuillEditorHTML("#rocrate-title-input")),
    desc: makeTextVersions(getQuillEditorHTML("#rocrate-desc-input")),
    about: makeTextVersions(getQuillEditorHTML("#rocrate-about")),
    timestamp: (new Date()).toISOString(),
    version: version,
    reactionSchemeFile: reactionSchemePresent() && getReactionScheme(),
    reactionSchemeImg: reactionSchemeImgPresent() && getReactionSchemeImg(),
    baselineDesc: baselineDescPresent() && makeTextVersions(getBaselineDesc()),
    condDescTable: condDescsPresent() && makeCondDescTable(getCondDescs()),
    licenseInfo: getLicenseInfo(),
    bibInfo: makeBibInfo(),
    plotData: plotData,
    sensitivityTable: makeSensitivityTable(plotData, true),
    gloriusPlotPromise: new Promise((resolve, reject) => {
      $(CHART_SELECTOR)[0].toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not create blob from canvas " + CHART_SELECTOR));
        }
      });
    })
  };

  // Create the zip file object and fill it with all desired files, then finally export it
  const rocrate = new JSZip();

  rocrate.file(ROCRATE_ROOT_DIR + "README.md", makeReadme(rocrateInfo));
  rocrate.file(ROCRATE_ROOT_DIR + "ro-crate-metadata.json", makeMetadata(rocrateInfo));
  rocrate.file(ROCRATE_ROOT_DIR + "ESI.pdf", makeESI(rocrateInfo));

  if (rocrateInfo.reactionSchemeFile)
    rocrate.file(ROCRATE_DATA_DIR + "reaction_scheme.cdxml", rocrateInfo.reactionSchemeFile);
  if (rocrateInfo.baselineDesc)
    rocrate.file(ROCRATE_DATA_DIR + "standard_conditions.html", makeBaselineDesc(rocrateInfo.baselineDesc.html));
  if (rocrateInfo.condDescTable)
    rocrate.file(ROCRATE_DATA_DIR + "test_conditions.csv", rocrateInfo.condDescTable.csv);

  rocrate.file(ROCRATE_PLOT_DIR + "user_preferences.json", JSON.stringify(rocrateInfo.plotData));
  rocrate.file(ROCRATE_PLOT_DIR + "sensitivity_table.csv", rocrateInfo.sensitivityTable.csv);
  rocrate.file(ROCRATE_PLOT_DIR + "glorius_plot.png", rocrateInfo.gloriusPlotPromise);

  rocrate.generateAsync({ type: "blob" })
    .then(function (blob) {

      // Get a timestamp in the format YYYY-MM-DD-HHMMSS-
      let timestamp = (new Date()).toISOString();
      timestamp = timestamp.replace(/[TZ]/g, "-").replace(/:|(\.\d*)/g, "");

      saveBlob(blob, timestamp + ROCRATE_FILENAME_BASE);
    });
}

/**
 * Collect the author info and pass it to the formatter to make the bibliographic info section of the readme and
 * metadata files
 * @returns {Array<string>} First element: Text for the ReadMe file, Second element: Text for author list in metadata,
 * Third element: Text for biblio info in metadata file
 */
function makeBibInfo() {
  const lNamesAndORCIDs = [];

  $(".rocrate-contrib-row").each((_, el) => {
    const oEl = $(el);
    const name = oEl.find(".rocrate-name-input").val();
    const orcId = oEl.find(".rocrate-orcid-input").val();
    lNamesAndORCIDs.push([name, orcId]);
  });

  const contactEmail = $("#rocrate-email-input").val();

  const bibInfo = {
    readmeInfo: formatReadmeBibInfo(lNamesAndORCIDs, contactEmail),
    esiInfo: formatESIBibInfo(lNamesAndORCIDs, contactEmail)
  };
  [bibInfo.authorInfoText, bibInfo.bibInfoText] = formatMetadataBibInfo(lNamesAndORCIDs);

  return bibInfo;
}

// Functions related to automatic updating

function enableCanvasUpdate() {
  $("#width-input").on("change", updateWidth);
  $("#height-input").on("change", updateHeight);
  $("#label-font-size-input").on("change", updateFontSize);
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
  $("#auto-update-toggle").on("click", toggleAutoUpdates);
}

function enableButtons() {
  $("#fill-random").on("click", fillRandom);
  $("#fill-example").on("click", fillExample);

  $("#generate-plot").on("click", generatePlot);

  $("#export-image-png").on("click", () => exportImage(CHART_SELECTOR, "png"));
  $("#export-rocrate-start").on("click", startROCrateExport);

  $("#save-data").on("click", () => saveObject(getPlotData(), "glorius_plot_data.json"));
  $("#load-data").on("click", loadPlotData);
  $("#load-data-file").on("change", checkPlotDataFile);

  $("#reset-plot-dims").on("click", resetPlotDims);

  $("#returnToDataInput").on("click", () => scrollToSection("#data-input"));
  $(".returnToROCrateExport").on("click", () => scrollToSection("#rocrate-export-title"));

  $("#rocrate-default-title-desc").on("click", useDefaultROCrateTitleDesc);
  $("#rocrate-revert-title-desc").on("click", revertROCrateTitleDesc);

  $("#rocrate-default-citation").on("click", useDefaultCitation);
  $("#rocrate-revert-citation").on("click", revertCitation);

  $("#rocrate-download").on("click", exportROCrate);
}

function enableNavigation() {

  const inputElements = $("td.condition-label-cell, td.baseline-value-cell, td.sample-value-cell");

  // Enable tabbing through row add/remove buttons whenever this is called
  enableRowButtonTabs();

  // When inputs are focused, disable tabbing through row add/remove, and reenable it when blurred
  inputElements.off("focus");
  inputElements.on("focus", "input, .ql-editor", disableRowButtonTabs);
  inputElements.off("blur");
  inputElements.on("blur", "input, .ql-editor", enableRowButtonTabs);

  // Disable and re-enable tab/enter/esc navigation within the form
  inputElements.off("keyup");
  inputElements.on("keyup", "input, .ql-editor", function (e) {
    if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Tab") {
      e.preventDefault();
      navigateCell(e);
    } else if (e.code === "Escape") {
      navigateToRowButtons(e);
    }
  });
}

function enableOnChangeTriggers() {

  enableDeviationCalc();
  enableCanvasUpdate();

  $("#fan-select").on("change", toggleChartMode);
  $("#dev-plot-select").on("change", generateIfUpdating);
  $(".output-label-select").on("change", updateOutputLabelSelection);
  $("#color-select").on("change", updateColourSchemeSelection);
  $("#min-color-input").on("change", selectCustomColourScheme);
  $("#max-color-input").on("change", selectCustomColourScheme);
  $(".plot-select").on("change", updatePlotSelect);
}

function disableAutoUpdates() {
  $(".trigger-chart-update").off("change");
  autoUpdating = false;

  // Re-enable any on change triggers aside from chart updating
  enableOnChangeTriggers();
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
  $("select#num-" + dim).on("change", (e) => setNumDim(dim, $(e.target).val()))
}

function updateOutputLabelSelection(e) {
  let newValue = this.value;
  let outcomeInputCell = $(".output-label-value-cell");
  let outcomeInput = $("#ol-0 .ql-editor p");

  if (newValue != "Other") {
    outcomeInputCell.addClass("hidden");
    outcomeInput.html(newValue);
  } else {
    outcomeInputCell.removeClass("hidden");
    outcomeInput.html("");
  }
}

function updateOutputLabel(label) {
  let lOutputHeadings = $(".sample-heading");
  let numSamples = getNumSamples();

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

function updateOutputLabelCallback() {
  updateOutputLabel(getOutputLabel());
  updateROCrateOutputLabel();
}

function updateColourSchemeSelection() {
  let newValue = this.value;

  if (newValue !== "custom") {
    if (lastColorVal === "custom") {
      lastCustomColorMin = $("#min-color-input").val();
      lastCustomColorMax = $("#max-color-input").val();
    }
    $("#min-color-input").val(D_COLOR_SCHEMES[newValue].min);
    $("#max-color-input").val(D_COLOR_SCHEMES[newValue].max);
  } else if (lastCustomColorMin && lastColorVal !== "custom") {
    $("#min-color-input").val(lastCustomColorMin);
    $("#max-color-input").val(lastCustomColorMax);
  }
  lastColorVal = newValue;

  generateIfUpdating();
}

/**
 * When the colour is manually changed, change to the "Other" scheme in the selection box
 */
function selectCustomColourScheme() {
  $("#color-select").val("custom").change();
}

/**
 * Outline the desired column depending on the selected plot mode
 */
function updatePlotSelect() {
  const devPlotMode = getDevPlotMode();

  $(".sample-button-cell, .mean-heading, .abs-deviation-heading, " +
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
  lastLabelFontSizeWidthRatio = getLabelFontSizeWidthRatio();
  lastLabelFontSizeHeightRatio = getLabelFontSizeHeightRatio();
  lastAxisFontSizeWidthRatio = getAxisFontSizeWidthRatio();
  lastAxisFontSizeHeightRatio = getAxisFontSizeHeightRatio();

  initWidth = getWidth(), initHeight = getHeight();
  initLabelFontSize = getLabelFontSize(), initAxisFontSize = getAxisFontSize();
}

/**
 * Enable all tooltips on the page
 */
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

function initQuill() {

  addQuillEditor("#title-input", "e.g. “Reaction-condition sensitivity analysis”");
  addQuillEditor("#ol-0", "Define outcome");

  $(".condition-input").each((i) => {
    addQuillEditor("#cl-" + i, CONDITION_PLACEHOLDER);
  });

  addQuillEditor("#rocrate-baseline-desc");

  $(".rocrate-cond-desc-input").each((i) => {
    addQuillEditor("#rcdi-" + i, CONDITION_DESC_PLACEHOLDER);
  });

  addQuillEditor("#rocrate-title-input");
  addQuillEditor("#rocrate-desc-input");
  addQuillEditor("#rocrate-about");
  addQuillEditor("#rocrate-citation");

  enableQuillEventsAndCallbacks();
}

function enableQuillEventsAndCallbacks() {
  // Set up other callbacks we want to set up for specific editors, then enable all events tied to editors
  const otherCallbacks = {
    "#ol-0": updateOutputLabelCallback,
    "#rocrate-baseline-desc": checkBaselineDesc,
    "#rocrate-citation": () => { userHasEditedCitation = true; }
  };
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; ++i) {
    otherCallbacks["#cl-" + i] = () => { updateCondDescLabel(i) };
    if (roCrateFormUpdating)
      otherCallbacks["#rcdi-" + i] = checkCondDescs;
  }
  enableQuillEvents(generateIfUpdating, otherCallbacks);
}

function enableROCrateOnChangeTriggers() {
  $("#rocrate-cdxml").on("change", updateReactionScheme);
  $("input[name='rocrate-license']").on("change", updateLicense);
  $("#num-contrib").on("change", setNumROCrateContribRow)
}

$(document).ready(function () {

  initDirtyForms("form", DIRTY_FORMS_MESSAGE);

  initTooltips(), initGlobals(), initQuill();

  L_DIMS.forEach(dim => initNumDimControls(dim));
  enableOnChangeTriggers(), enableToggles(), enableButtons(), enableNavigation();

  enableDeviationCalc(), enableAutoUpdates(), enableCanvasUpdate();

  enableROCrateOnChangeTriggers();
  postContribRowUpdate();

  // Special handling if we're debugging
  if (debug) {
    // Fill with example data
    fillExample();

    // Open the ROCrate Export section and enable export even if checks don't pass
    startROCrateExport(false);
    updateROCrateDownloadEnabled();

    // The plot title is updated on a bit of a lag, so we do a brief async wait then call for it to be set in the
    // RO-crate section too
    setTimeout(() => {
      useDefaultROCrateTitleDesc();
      useDefaultCitation();
    }, 100);
  }
});
