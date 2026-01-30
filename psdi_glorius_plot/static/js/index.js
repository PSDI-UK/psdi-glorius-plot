/**
 * @file JavaScript code to handle the special functionality of the index.html page
 * @date 2025-08-06
 * @author Bryan Gillis
 */

import { initDirtyForms, cleanDirtyForms, checkIsDirty } from "./dirty-forms.js";
import { mixHexes } from "./color-mixing.js"
import { exportImage, loadObject, saveObject } from "./io.js"
import { clamp, disableButton, enableButton, getWebKitMode } from "./utility.js"
import {
  addQuillEditor, getQuillEditor, getQuillEditorHTML, setQuillEditor, removeQuillEditor, updateQuillContents,
  disableQuillToolbar, enableQuillEvents, stripTags, waitForMathJax, drawFormatted, incrementRenderBatch,
} from "./formatted-labels.js"

const VERSION = "0.2";

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
const COLOR_TRANSPARENT = "#FFFFFF00";
const BORDER_WIDTH = 4, L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BASELINE_WIDTH = 4, BASELINE_COLOR = "#FFFFFF";
const DATA_BG_COLOR = [COLOR_TRANSPARENT];
const SHOW_GRID_LINES = true, SHOW_AXIS_LINES = true;
const GRID_WIDTH = 1, GRID_COLOR = "#00000080";
const TIP_SIZE = 3, BASE_SEPARATION = 3;
const BAR_SIZE = 2 * (TIP_SIZE + BASE_SEPARATION + 1);

// Text and placeholders for the RO-crate export section
const BASELINE_DESC_INFO_TEXT = "Add text to describe the experimental conditions that give the REPLACEME you " +
  "reported for the “Standard Conditions” of your chemical process:";

const DEFAULT_DATASET_ABOUT_TEXT = "This dataset enables users to visualise the sensitivity of a given chemical " +
  "transformation to user-defined reaction conditions through the use of a Glorius Plot, based on an original concept " +
  "from the Glorius research group.";

const CITATION_AUTHOR_EXAMPLE_TEXT = "Author, A.; Author, B.; and Author, C.";

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
  citationAuthor: false
};

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
 * Get the index value stored at the end of an event's target's ID, setting to the maximum possible index if the event
 * is null
 * @param {*} e The triggering event
 * @param {number} indexLength The length of the axis for this index (one more than its maximum value if it's
 *                             zero-indexed)
 * @return {number} The index of the triggering event, or else the maximum index
 */
function getTargetIndex(e, indexLength) {
  let targetIndex;
  if (e === null) {
    targetIndex = indexLength - 1;
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
      let headingText = getQuillEditorHTML("#ol-0");
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
  enableQuillEvents(generateIfUpdating, updateOutputLabelCallback);

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
  enableQuillEvents(generateIfUpdating, updateOutputLabelCallback);

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
  $(".condition-input").each((i, e) => {
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
 * @returns 
 */
function getPlotData() {
  let data = {
    "version": VERSION,
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

function checkPlotDataFile(event) {
  let lFiles = this.files;
  if (lFiles.length > 0) {
    $("#load-data").removeClass("init-disabled")
    $("#load-data").prop({ disabled: false });
  } else {
    $("#load-data").addClass("init-disabled");
    $("#load-data").prop({ disabled: true });
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

    let valueSelector, inputSelector;
    if (devPlotMode == "mean")
      valueSelector = ".mean-value-cell", inputSelector = "input.mean-value"
    else if (devPlotMode == "absolute")
      valueSelector = ".abs-deviation-value-cell", inputSelector = "input.abs-deviation-value"
    else
      valueSelector = ".rel-deviation-value-cell", inputSelector = "input.rel-deviation-value"
    const lCells = lSensRows.eq(i).find(valueSelector);
    const lInputs = lCells.eq(0).find(inputSelector);

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
function startROCrateExport() {
  $(".hidden-after-rocrate").addClass("hidden");
  $(".hidden-until-rocrate").removeClass("hidden");
  $(".rocrate-export").removeClass("hidden");

  // Flag that we'll now want to start updating the RO-crate form, and do so now
  roCrateFormUpdating = true;
  updateROCrateForm(true);

  scrollToSection("#rocrate-export-title");
}

function updateROCrateForm(firstTime = false) {
  // To save processing, this form only starts being updated after the user first reveals it
  if (!roCrateFormUpdating)
    return;

  // Update the description text for the standard conditions description box
  // If it's one of the built-in labels, make it lowercase. Don't if it's Custom, since we don't know if it's
  // case-sensitive or not and it's better to play it safe
  let outputLabel = getOutputLabel();
  if ($(".output-label-select").val() != "Other")
    outputLabel = outputLabel.toLowerCase();
  else if (outputLabel == "")
    outputLabel = "outcome";

  $("label[for=\"baseline-desc-container\"]").html(BASELINE_DESC_INFO_TEXT.replace("REPLACEME", outputLabel));

  // The first time the form is updated only, set the title and about section based on what's in the form above
  if (firstTime)
    updateROCrateTitleDesc();
}

function updateROCrateTitleDesc() {
  updateQuillContents("#rocrate-title-input", getTitle());
  updateQuillContents("#rocrate-about", DEFAULT_DATASET_ABOUT_TEXT);
}

function checkCitationAuthors() {
  const citationText = getQuillEditorHTML("#rocrate-citation");
  if (citationText.includes(CITATION_AUTHOR_EXAMPLE_TEXT)) {
    exportChecks.citationAuthor = false;
    $("#rocrate-citation-author-error").removeClass("hidden");
  } else {
    exportChecks.citationAuthor = true;
    $("#rocrate-citation-author-error").addClass("hidden");
  }
  updateROCrateDownloadEnabled();
}

function updateROCrateDownloadEnabled() {
  let allGood = true;
  Object.values(exportChecks).forEach((check) => {
    if (!check)
      allGood = false;
  });
  if (allGood)
    $("#rocrate-download").removeAttr("disabled");
  else
    $("#rocrate-download").attr("disabled", "disabled");
}

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

  $("#rocrate-default-title-desc").on("click", updateROCrateTitleDesc);
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
  updateOutputLabel(getQuillEditorHTML("#ol-0"));
  updateROCrateForm();
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

  generateIfUpdating();
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
  addQuillEditor("#rocrate-about");
  addQuillEditor("#rocrate-citation");
  getQuillEditor("#rocrate-citation").
    checkCitationAuthors

  // Set up other callbacks we want to set up for specific editors, then enable all events tied to editors
  const otherCallbacks = {
    "#ol-0": updateOutputLabelCallback,
    "#rocrate-citation": checkCitationAuthors
  };
  enableQuillEvents(generateIfUpdating, otherCallbacks);
}

$(document).ready(function () {

  initDirtyForms("form", DIRTY_FORMS_MESSAGE);

  initTooltips(), initGlobals(), initQuill();

  L_DIMS.forEach(dim => initNumDimControls(dim));
  enableOnChangeTriggers(), enableToggles(), enableButtons(), enableNavigation();

  enableDeviationCalc(), enableAutoUpdates(), enableCanvasUpdate();
});
