/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms, cleanDirtyForms } from "./common.js";
import { mix_hexes } from "./color.js"

const CONDITION = "condition"
const SAMPLE = "sample"
const OUTPUT = "output"

const L_DIMS = [CONDITION, SAMPLE, OUTPUT]

const DIM_LIMITS = {
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
    max: 5
  }
}

const DEFAULT_VALUE_MEAN = 100;

// Table values and placeholders
const OUTPUT_LABEL_TEXT = "Output {N} Label:";

// Plot styling
const L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BORDER_WIDTH = 4;
const DATA_BG_COLOR = ["#FFFFFF00"];
const GRID_WIDTH = 1;
const GRID_COLOR = "#00000080";

// Globals
let autoUpdating = false;
let directInput = false;
let radarChart = null;

// When the script is initially loaded, store a copy of a heading element and cell elements that we'll later use
// as templates to add new rows

const TEMPLATE_OUTPUT_LABEL_ROW = $(".output-label-row")[0].cloneNode(true);
const TEMPLATE_BASELINE_INPUT_LINE = $(".baseline-input-line")[0].cloneNode(true);
const TEMPLATE_SAMPLE_INPUT_LINE = $(".sample-input-line")[0].cloneNode(true);
const TEMPLATE_DEVIATION_INPUT_LINE = $(".deviation-input-line")[0].cloneNode(true);

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
  return $(".value-heading").length;
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

function setNumDim(dim, num) {

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

  postTableUpdateCleanup(dim, true);
}

function relabelDim(dim) {
  if (dim == CONDITION)
    relabelConditionRows();
  else if (dim == SAMPLE)
    relabelSampleCols();
  else
    relabelOutputLabelRows();
}

/**
 * Get the index value stored at the end of an event's target's ID
 */
function getIndexFromEvent(e) {
  let eId = e.target.id;
  return +(eId.split("-").at(-1));
}

function updateDimSelector(dim) {
  $("select#num-" + dim).val(getDimSize(dim)).change();
}

function postTableUpdateCleanup(dim, updateAfter) {

  // Enable auto updates for new cells if it's turned on
  if (autoUpdating) {
    enableAutoUpdates();
  }

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateDimSelector(dim);
    initNumDimControls(dim);
    relabelDim(dim);
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }

}

/**
 * Relabel all the condition rows after one is added or removed, fixing their behind-the-scenes values of which index
 * they're at
 */
function relabelConditionRows() {

  const numRows = getNumConditions();
  const lRows = $(".condition-row");

  for (let j = 0; j < numRows; j++) {
    const row = $(lRows[j]);
    const rowNumberString = j.toString();

    // Fix the IDs of the buttons
    row.find(".remove-condition").attr("id", "remove-rb-" + rowNumberString);
    row.find(".add-condition").attr("id", "add-rb-" + rowNumberString);
  }
}

function addConditionRow(e, updateAfter = true) {

  // Check that we don't already have too many conditions
  const numConditions = getNumConditions();
  if (numConditions >= DIM_LIMITS.condition.max) {
    console.error("Attempt to add condition when maximum rows already reached");
    return;
  }

  // Construct a new row by copying the first and clearing its input
  const newRow = $(".condition-row")[0].cloneNode(true);
  $(newRow).find(".condition-label").val("");
  $(newRow).find(".deviation-value").val("0");

  // Determine where to add the row based on which button was clicked
  let targetRow;
  if (e === null)
    targetRow = numConditions - 1;
  else
    targetRow = getIndexFromEvent(e);

  if (targetRow >= numConditions - 1)
    $(".sensitivity-table tbody")[0].appendChild(newRow);
  else
    $(".sensitivity-table tbody")[0].insertBefore(newRow, $(".condition-row")[targetRow + 1]);


  // Check if we've reached the maximum number of rows, and disable the button to add rows if so
  if (numConditions + 1 >= DIM_LIMITS.condition.max) {
    disableButton($("button.add-condition"));
  }

  // Check if we've passed the minimum number of rows, and enable the button to remove rows if so
  if (numConditions + 1 > DIM_LIMITS.condition.min) {
    enableButton($("button.remove-condition"));
  }

  postTableUpdateCleanup("condition", updateAfter);
}

function removeConditionRow(e, updateAfter = true) {

  // Check that we don't already have too few rows
  const numConditions = getNumConditions();
  if (numConditions <= DIM_LIMITS.condition.min) {
    console.error("Attempt to remove row when minimum rows already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  let targetRow;
  if (e === null)
    targetRow = numConditions - 1;
  else
    targetRow = getIndexFromEvent(e);

  // Remove the row from the table
  $(".sensitivity-table tbody")[0].removeChild($(".condition-row")[targetRow]);

  // Check if we've reached the minimum number of rows, and disable the buttons to remove rows if so
  if (numConditions - 1 <= DIM_LIMITS.condition.min) {
    disableButton($(".remove-condition"));
  }

  // Check if we've gotten under the minimum number of rows, and enable the buttons to add rows if so
  if (numConditions - 1 < DIM_LIMITS.condition.max) {
    enableButton($(".add-condition"));
  }

  postTableUpdateCleanup("condition", updateAfter);
}

/**
 * Relabel all the sample columns after one is added or removed, fixing their behind-the-scenes values of which index
 * they're at, and the displayed sample number
 */
function relabelSampleCols() {

  const numSamples = getNumSamples();
  const lSampleButtonCells = $(".sample-button-cell");
  const lSampleHeadings = $(".value-heading");

  for (let k = 0; k < numSamples; k++) {

    // Set the heading text
    let headingText;
    if (numSamples == 1)
      headingText = "Value";
    else
      headingText = "Sample " + (k + 1).toString();
    lSampleHeadings.eq(k).text(headingText);

    // Fix the IDs of the buttons
    const buttonCell = lSampleButtonCells.eq(k);
    const sampleNumberString = k.toString();
    buttonCell.find(".remove-sample").attr("id", "remove-sb-" + sampleNumberString);
    buttonCell.find(".add-sample").attr("id", "add-sb-" + sampleNumberString);
  }
}

function addSampleCol(e, updateAfter = true) {

  // Check that we don't already have too many samples
  const numSamples = getNumSamples();
  if (numSamples >= DIM_LIMITS.sample.max) {
    console.error("Attempt to add sample when maximum samples already reached");
    return;
  }

  // Determine where to add the column based on which button was clicked
  let targetCol;
  if (e === null)
    targetCol = numSamples - 1;
  else
    targetCol = getIndexFromEvent(e);

  // Construct and insert a new button cell, heading cell, and baseline value cell
  const newButtonCell = $(".sample-button-cell")[0].cloneNode(true);
  const newHeadingCell = $(".value-heading")[0].cloneNode(true);
  const newBaselineValueCell = $(".baseline-value-cell")[0].cloneNode(true);
  $(newBaselineValueCell).find(".baseline-value").val("");

  if (targetCol >= numSamples - 1) {
    $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".button-deviation-cell")[0]);
    $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".deviation-heading")[0]);
    $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-deviation-cell")[0]);
  } else {
    $(".sensitivity-buttons")[0].insertBefore(newButtonCell, $(".sample-button-cell")[targetCol + 1]);
    $(".sensitivity-header")[0].insertBefore(newHeadingCell, $(".value-heading")[targetCol + 1]);
    $(".baseline-row")[0].insertBefore(newBaselineValueCell, $(".baseline-value-cell")[targetCol + 1]);
  }

  // For each row of the table, construnct and insert a new value cell
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; i++) {
    const conditionRow = $(".condition-row")[i];
    const lValueCells = $(conditionRow).find(".sample-value-cell");
    const newValueCell = lValueCells[0].cloneNode(true);
    $(newValueCell).find(".sample-value").val("");

    if (targetCol >= numSamples - 1)
      conditionRow.insertBefore(newValueCell, $(conditionRow).find(".deviation-value-cell")[0]);
    else
      conditionRow.insertBefore(newValueCell, lValueCells[targetCol + 1]);
  }

  // Check if we've reached the maximum number of samples, and disable the button to add samples if so
  if (numSamples + 1 >= DIM_LIMITS.sample.max) {
    disableButton($(".add-sample"));
  }

  // Check if we've passed the minimum number of samples, and enable the button to remove samples if so
  if (numSamples + 1 > DIM_LIMITS.sample.min) {
    enableButton($(".remove-sample"));
  }

  postTableUpdateCleanup("sample", updateAfter);
}

function removeSampleCol(e, updateAfter = true) {

  // Check that we don't already have too few samples
  const numSamples = getNumSamples();
  if (numSamples <= DIM_LIMITS.sample.min) {
    console.error("Attempt to remove sample when minimum samples already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  let targetCol;
  if (e === null)
    targetCol = numSamples - 1;
  else
    targetCol = getIndexFromEvent(e);

  // Remove the appropriate button cell, heading cell, and baseline cell

  $(".sensitivity-buttons")[0].removeChild($(".sample-button-cell")[targetCol]);
  $(".sensitivity-header")[0].removeChild($(".value-heading")[targetCol]);
  $(".baseline-row")[0].removeChild($(".baseline-value-cell")[targetCol]);

  // For each row of the table, remove the appropriate value cell
  const numConditions = getNumConditions();
  for (let i = 0; i < numConditions; i++) {
    const conditionRow = $(".condition-row")[i];
    conditionRow.removeChild($(conditionRow).find(".sample-value-cell")[targetCol]);
  }

  // Check if we've reached the minimum number of rows, and disable the buttons to remove rows if so
  if (numSamples - 1 <= DIM_LIMITS.sample.min) {
    disableButton($(".remove-sample"));
  }

  // Check if we've gotten under the minimum number of rows, and enable the buttons to add rows if so
  if (numSamples - 1 < DIM_LIMITS.sample.max) {
    enableButton($(".add-sample"));
  }

  postTableUpdateCleanup("sample", updateAfter);
}

/**
 * Relabel all the output rows after one is added or removed, fixing their behind-the-scenes values of which index
 * they're at
 */
function relabelOutputLabelRows() {

  const numOutputs = getNumOutputs();
  const lOutputLabelRows = $(".output-label-row");

  for (let j = 0; j < numOutputs; j++) {
    const outputLabelRow = $(lOutputLabelRows[j]);
    const rowNumberString = j.toString();

    // Fix the IDs of the add/remove buttons
    outputLabelRow.find(".remove-output").attr("id", "remove-ob-" + rowNumberString);
    outputLabelRow.find(".add-output").attr("id", "add-ob-" + rowNumberString);

    // Fix the text and "for" attribute of the label
    const outputLabelLabel = outputLabelRow.find(".output-label-label");
    outputLabelLabel.text(OUTPUT_LABEL_TEXT.replace("{N}", (j + 1).toString()));
    outputLabelLabel.attr("for", "ol-" + rowNumberString);

    // Fix the ID of the input
    outputLabelRow.find(".output-label-input").attr("id", "ol-" + rowNumberString);
  }
}

function addOutput(e, updateAfter = true) {

  // Check that we don't already have too many outputs
  const numOutputs = getNumOutputs();
  if (numOutputs >= DIM_LIMITS.output.max) {
    console.error("Attempt to add output when maximum outputs already reached");
    return;
  }

  // Set up the new output label row
  const newOutputLabelRow = TEMPLATE_OUTPUT_LABEL_ROW.cloneNode(true);
  $(newOutputLabelRow).find(".output-label-input").val("");

  // Determine where to add the row based on which button was clicked
  let targetRow;
  if (e === null)
    targetRow = numOutputs - 1;
  else
    targetRow = getIndexFromEvent(e);

  if (targetRow >= numOutputs - 1)
    $(".output-label-table tbody")[0].appendChild(newOutputLabelRow);
  else
    $(".output-label-table tbody")[0].insertBefore(newOutputLabelRow, $(".output-label-row")[targetRow + 1]);

  // Add a new input line to each value cell
  const lSensValueCells = $(".baseline-value-cell, .sample-value-cell, .deviation-value-cell");
  for (let i = 0; i < lSensValueCells.length; ++i) {

    // Clone a new node from the proper template
    const sensValueCell = lSensValueCells[i];
    let templateLine;
    if (sensValueCell.classList.contains("sample-value-cell"))
      templateLine = TEMPLATE_SAMPLE_INPUT_LINE;
    else if (sensValueCell.classList.contains("baseline-value-cell"))
      templateLine = TEMPLATE_BASELINE_INPUT_LINE;
    else
      templateLine = TEMPLATE_DEVIATION_INPUT_LINE;

    const newSensInputLine = templateLine.cloneNode(true);

    if (targetRow >= numOutputs - 1)
      sensValueCell.appendChild(newSensInputLine);
    else
      sensValueCell.insertBefore(newSensInputLine, lSensValueCells[i].children[targetRow + 1]);
  }

  // Check if we've reached the maximum number of outputs, and disable the button to add outputs if so
  if (numOutputs + 1 >= DIM_LIMITS.output.max) {
    disableButton($("button.add-output"));
  }

  // Check if we've passed the minimum number of outputs, and enable the button to remove outputs if so
  if (numOutputs + 1 > DIM_LIMITS.output.min) {
    enableButton($("button.remove-output"));
  }

  postTableUpdateCleanup("output", updateAfter);
}

function removeOutput(e, updateAfter = true) {

  // Check that we don't already have too few outputs
  const numOutputs = getNumOutputs();
  if (numOutputs <= DIM_LIMITS.output.min) {
    console.error("Attempt to remove output when minimum outputs already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  let targetRow;
  if (e === null)
    targetRow = numOutputs - 1;
  else
    targetRow = getIndexFromEvent(e);

  // Remove the row from the output label table
  $(".output-label-table tbody")[0].removeChild($(".output-label-row")[targetRow]);

  // Remove the input line from each cell in the sens table
  const lSensValueCells = $(".baseline-value-cell, .sample-value-cell, .deviation-value-cell");;
  for (let i = 0; i < lSensValueCells.length; ++i) {
    lSensValueCells[i].removeChild(lSensValueCells[i].children[targetRow]);
  }

  // Check if we've reached the minimum number of outputs, and disable the button to remove outputs if so
  if (numOutputs - 1 <= DIM_LIMITS.output.min) {
    disableButton($("button.remove-output"));
  }

  postTableUpdateCleanup("output", updateAfter);
}

// Functions to get various options set by the user

function getMinOutput() {
  let minOutput = $("#min-output-input").val();
  minOutput = Math.min(Math.max(minOutput, -100), -1);
  return minOutput;
}

function getMaxOutput() {
  let maxOutput = $("#max-output-input").val();
  maxOutput = Math.min(Math.max(maxOutput, 1), 1000);
  return maxOutput;
}

function getBandWidth() {
  let bandWidth = $("#band-width-input").val();
  bandWidth = Math.min(Math.max(bandWidth, 1), 1000);
  return bandWidth;
}

function getMinColor() {
  return $("#min-color-input").val();
}

function getMaxColor() {
  return $("#max-color-input").val();
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

  const lBaselineCells = $(".baseline-value-cell");

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
    if (lBaselineSamples.length > 0)
      lBaselineMeans.push(lBaselineSamples.reduce((a, b) => a + b) / lBaselineSamples.length);
    else
      lBaselineMeans.push(DEFAULT_VALUE_MEAN);
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

    const lDeviationInputs = conditionRow.find(".deviation-input-line");
    for (let j = 0; j < numOutputs; j++) {

      const baselineMean = lBaselineMeans[j];
      const lConditionSamples = llConditionSamples[j];

      let conditionMean;
      if (lConditionSamples.length > 0)
        conditionMean = lConditionSamples.reduce((a, b) => a + b) / lConditionSamples.length;
      else
        conditionMean = baselineMean;

      const deviation = (conditionMean - baselineMean) / baselineMean * 100;

      const deviationInput = lDeviationInputs.eq(j).find(".deviation-value");
      deviationInput.val(deviation);
    }

  }
}

/**
 * Generate the plot using all the provided data
 */
function generatePlot() {

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
  const bandWidth = getBandWidth();

  const numLowBands = Math.ceil(-minOutput / bandWidth);
  const numHiBands = Math.ceil(maxOutput / bandWidth);

  const numBgColorsLow = numLowBands;
  const numBgColorsHi = numHiBands + 1;
  const numBgColors = numBgColorsLow + numBgColorsHi;

  const lBgColorBoundsLow = [];
  const lBgOrderLow = [];
  for (let i = 0; i < numBgColorsLow; ++i) {
    lBgColorBoundsLow.push(Math.max(-bandWidth * (i + 1), minOutput));
    lBgOrderLow.push(i + 1);
  }

  const lBgColorBoundsHi = [];
  const lBgOrderHi = [];
  for (let i = 0; i < numBgColorsHi; ++i) {
    lBgColorBoundsHi.push(Math.min(bandWidth * i, maxOutput));
    lBgOrderHi.push(i + 1);
  }

  const showGridLines = getShowGridLines();
  const showAxisLines = getShowAxisLines();

  // Create data we'll plot in the chart
  const lOutputLabels = [];
  const llData = [];
  const lOrder = [];
  const lBorderColors = [];
  const lBorderWidths = [];
  const lBackgroundColors = [];
  const lFill = [];
  const lBorderDashes = [];

  // Make fake data for each background color

  for (let k = 0; k < numBgColorsHi; ++k) {
    lOutputLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numConditions; ++i) {
      lFakeData.push(lBgColorBoundsHi[k]);
    }
    llData.push(lFakeData);
    lOrder.push(lBgOrderHi[k]);

    let colorRatio = k / (numBgColorsHi - 1);
    let backgroundColor = mix_hexes(getMaxColor(), "#FFFFFF", colorRatio);
    lBackgroundColors.push(backgroundColor);

    if (showGridLines) {
      lBorderColors.push(GRID_COLOR);
      lBorderWidths.push(GRID_WIDTH);
    } else {
      lBorderColors.push(backgroundColor);
      lBorderWidths.push(0);
    }

    lFill.push(true);
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

    let colorRatio = k / (numBgColorsLow - 1);
    let backgroundColor = mix_hexes(getMinColor(), "#FFFFFF", colorRatio);
    lBackgroundColors.push(backgroundColor);

    if (showGridLines) {
      lBorderColors.push(GRID_COLOR);
      lBorderWidths.push(GRID_WIDTH);
    } else {
      lBorderColors.push(backgroundColor);
      lBorderWidths.push(0);
    }

    lFill.push(true);
    lBorderDashes.push([]);
  }

  // Make fake data for each axis line we want to draw if desired
  let numAxisLines = 0;
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
  }

  // Get the output labels, and also set other fixed data for normal datasets
  const lOutputLabelInputs = $("input.output-label-input");
  for (let j = 0; j < numOutputs; ++j) {
    lOutputLabels.push(lOutputLabelInputs[j].value);
    lOrder.push(0);
    lBorderColors.push("black");
    lBorderWidths.push(BORDER_WIDTH);
    lBackgroundColors.push(DATA_BG_COLOR);
    lFill.push(false);
    lBorderDashes.push(L_BORDER_DASHES[j]);
  }

  // Get the condition labels
  const lConditionLabels = [];
  const lConditionLabelCells = $(".condition-label");
  for (let i = 0; i < numConditions; ++i) {
    lConditionLabels.push(lConditionLabelCells[i].value);
  }

  // Get data for each output
  for (let j = 0; j < numOutputs; ++j) {
    llData.push([]);
  }

  const lSensRows = $(".condition-row");
  const lConditionData = [];
  for (let i = 0; i < numConditions; ++i) {
    let lSingleConditionData = [];
    const lCells = lSensRows.eq(i).find(".deviation-value-cell");
    // TODO: Add loop over cells here
    const lInputs = lCells.eq(0).find("input.deviation-value");
    for (let j = 0; j < numOutputs; ++j) {
      lSingleConditionData.push(lInputs[j].value);
    }
    lConditionData.push({
      label: lConditionLabels[i],
      data: lSingleConditionData
    })
  }

  // Sort the data by the first value, depending on the sort mode
  let sort_mode = getDataSorting();
  lConditionData.sort(function (a, b) {
    return (a.data[0] - b.data[0]) * sort_mode;
  });

  // Add the sorted data to the main data array, and update the row labels
  for (let i = 0; i < numConditions; ++i) {
    lConditionLabels[i] = lConditionData[i].label;
    for (let j = 0; j < numOutputs; ++j) {
      llData[numBgColors + numAxisLines + j].push(lConditionData[i].data[j]);
    }
  }

  // Prepare the data as Datasets in the format expected by ChartJS
  const lDatasets = [];
  for (let j = 0; j < numBgColors + numAxisLines + numOutputs; ++j) {
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

  // Prepare the plot scale options
  const plotR = {
    min: minOutput,
    max: maxOutput,
    reverse: true,
    ticks: {
      stepSize: bandWidth,
      z: 2,
    },
    pointLabels: {
      font: {
        size: 16
      }
    }
  };

  if (radarChart === null) {
    // Generate the plot for the first time
    radarChart = new Chart("glorius-plot", {
      type: "radar",
      data: {
        labels: lConditionLabels,
        datasets: lDatasets,
      },
      options: {
        scales: {
          r: plotR
        },
        plugins: {
          legend: {
            labels: {
              boxHeight: 16,
              boxWidth: 16,
              font: {
                size: 16,
                weight: "bold"
              },
              filter: function (legendLabel, _) {
                return legendLabel.text != "";
              }
            }
          }
        },
        animation: false
      }
    })
  } else {
    radarChart.data = {
      labels: lConditionLabels,
      datasets: lDatasets,
    }
    radarChart.options.scales.r = plotR;
    radarChart.update();
  }

}

/**
 * Fill the existing cells with random data
 */
function fillRandom() {
  const numOutputs = getNumOutputs();

  // Fill the column labels
  const lOutputLabelInputs = $(".output-label-input");
  for (let j = 0; j < lOutputLabelInputs.length; ++j) {
    let value = "Yield"
    if (numOutputs > 1) {
      value += " " + (j + 1).toString();
    }
    lOutputLabelInputs[j].value = value;
  }

  // Fill the row labels
  const lRowLabelInputs = $(".condition-label");
  for (let i = 0; i < lRowLabelInputs.length; ++i) {
    lRowLabelInputs[i].value = (i + 1).toString();
  }

  // Fill each baseline cell
  const lBaselineInputs = $(".baseline-value");
  for (let k = 0; k < lBaselineInputs.length; ++k) {
    lBaselineInputs[k].value = DEFAULT_VALUE_MEAN;
  }

  // Fill each data cell
  const minOutput = getMinOutput();
  const maxOutput = getMaxOutput();
  const lDataCells = $(".sample-value");
  for (let k = 0; k < lDataCells.length; ++k) {
    const e = lDataCells[k];
    e.value = DEFAULT_VALUE_MEAN + minOutput + Math.random() * (maxOutput - minOutput);
  }

  // Make sure the deviation is calculated, even in direct input mode (if not in this mode, it will be calculated when
  // the plot is generated)
  if (directInput) {
    calcDeviation();
  }

  if (autoUpdating) {
    generatePlot();
  }

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

  $(".trigger-chart-update").on("change", generatePlot);
  $(".trigger-deviation-update").on("change", generatePlot);
  autoUpdating = true;
  generatePlot();
}

function disableAutoUpdates() {
  $(".trigger-chart-update").off("change");
  autoUpdating = false;

  // Set to still do deviation calculation automatically
  enableDeviationCalc();
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

function initNumDimControls(dim) {
  $("button.add-" + dim).off("click");
  $("button.remove-" + dim).off("click");
  $("select#num-" + dim).off("change");

  $("button.add-" + dim).on("click", (e) => addDim(dim, e, true));
  $("button.remove-" + dim).on("click", (e) => removeDim(dim, e, true));
  $("select#num-" + dim).on("change", (e) => setNumDim(dim, $(e.target).val()));
}

function toggleAutoUpdates(e) {
  if ($(e.target).is(":checked"))
    enableAutoUpdates();
  else
    disableAutoUpdates();
}

$(document).ready(function () {
  // Enable all tooltips on the page
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  initDirtyForms();

  $("#input-mode-toggle").on("click", toggleInputMode)

  L_DIMS.forEach(dim => initNumDimControls(dim));

  enableDeviationCalc();

  $("button#fill-random").on("click", fillRandom);
  $("button#generate-plot").on("click", generatePlot);

  $("#auto-update-toggle").on("click", toggleAutoUpdates)
  enableAutoUpdates();
});