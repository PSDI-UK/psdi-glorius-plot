/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms, cleanDirtyForms } from "./common.js";
import { mix_hexes } from "./color.js"

const MIN_CONDITIONS = 3;
const MAX_CONDITIONS = 12;

const MIN_OUTPUTS = 1;
const MAX_OUTPUTS = 5;

const DEFAULT_BASELINE_MEAN = 100;

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
let radarChart = null;

// When the script is initially loaded, store a copy of a heading element and cell elements that we'll later use
// as templates to add new rows

const TEMPLATE_OUTPUT_LABEL_ROW = $(".output-label-row")[0].cloneNode(true);
const TEMPLATE_BASELINE_INPUT_LINE = $(".baseline-input-line")[0].cloneNode(true);
const TEMPLATE_SAMPLE_INPUT_LINE = $(".sample-input-line")[0].cloneNode(true);
const TEMPLATE_DEVIATION_INPUT_LINE = $(".deviation-input-line")[0].cloneNode(true);

function getNumConditions() {
  return $(".condition-row").length;
}

function getNumOutputs() {
  return $(".output-label-row").length;
}

function getNumSamples() {
  return $(".sensitivity-header").children().length - 3;
}

function disableButton(button) {
  button.prop({ disabled: true });
}

function enableButton(button) {
  button.prop({ disabled: false });
}

function updateConditionSelector() {
  $("select#num-conditions").val(getNumConditions()).change();
}

function updateOutputSelector() {
  $("select#num-outputs").val(getNumOutputs()).change();
}

/**
 * Get the index value stored at the end of an event's target's ID
 */
function getIndexFromEvent(e) {
  let eId = e.target.id;
  return +(eId.split("-").at(-1));
}

/**
 * Relabel all the condition rows after one is added or removed, fixing their behind-the-scenes values of which index
 * they're at
 */
function relableConditionRows() {

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
  if (numConditions >= MAX_CONDITIONS) {
    console.error("Attempt to add condition when maximum rows already reached");
    return;
  }

  // Construct a new row by copying the first and clearing its input
  const newRow = $(".condition-row")[0].cloneNode(true);
  $(newRow).find(".condition-label").val("");
  $(newRow).find(".deviation-value").val("0");

  // Determine where to add the row based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numConditions - 1;
  } else {
    targetRow = getIndexFromEvent(e);
  }
  if (targetRow >= numConditions - 1) {
    $(".sensitivity-table tbody")[0].appendChild(newRow);
  } else {
    $(".sensitivity-table tbody")[0].insertBefore(newRow, $(".condition-row")[targetRow + 1]);
  }


  // Check if we've reached the maximum number of rows, and disable the button to add rows if so
  if (numConditions + 1 >= MAX_CONDITIONS) {
    disableButton($("button.add-condition"));
  }

  // Check if we've passed the minimum number of rows, and enable the button to remove rows if so
  if (numConditions + 1 > MIN_CONDITIONS) {
    enableButton($("button.remove-condition"));
  }

  // Enable auto updates for new cells if it's turned on
  if (autoUpdating) {
    enableAutoUpdates();
  }

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateConditionSelector();
    relableConditionRows();
    initNumParamControls();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function removeConditionRow(e, updateAfter = true) {

  // Check that we don't already have too few rows
  const numConditions = getNumConditions();
  if (numConditions <= MIN_CONDITIONS) {
    console.error("Attempt to remove row when minimum rows already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numConditions - 1;
  } else {
    targetRow = getIndexFromEvent(e);
  }

  const sensTable = $(".sensitivity-table tbody")[0];
  const lRows = $(".condition-row");
  sensTable.removeChild(lRows[targetRow]);

  // Check if we've reached the minimum number of rows, and disable the buttons to remove rows if so
  if (numConditions - 1 <= MIN_CONDITIONS) {
    disableButton($(".remove-condition"));
  }

  // Check if we've gotten under the minimum number of rows, and enable the buttons to add rows if so
  if (numConditions - 1 < MAX_CONDITIONS) {
    enableButton($(".add-condition"));
  }

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateConditionSelector();
    relableConditionRows();
    initNumParamControls();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

/**
 * Relabel all the output rows after one is added or removed, fixing their behind-the-scenes values of which index
 * they're at
 */
function relableOutputLabelRows() {

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
  if (numOutputs >= MAX_OUTPUTS) {
    console.error("Attempt to add output when maximum outputs already reached");
    return;
  }

  // Set up the new output label row
  const newOutputLabelRow = TEMPLATE_OUTPUT_LABEL_ROW.cloneNode(true);
  newOutputLabelRow.children[1].children[0].value = "";

  // Determine where to add the row based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numOutputs - 1;
  } else {
    targetRow = getIndexFromEvent(e);
  }
  if (targetRow >= numOutputs - 1) {
    $(".output-label-table tbody")[0].appendChild(newOutputLabelRow);
  } else {
    $(".output-label-table tbody")[0].insertBefore(newOutputLabelRow, $(".output-label-row")[targetRow + 1]);
  }

  // Add a new input line to each value cell
  const lSensValueCells = $(".baseline-value-cell, .sample-value-cell, .deviation-value-cell");
  for (let i = 0; i < lSensValueCells.length; ++i) {

    // Clone a new node from the proper template
    const sensValueCell = lSensValueCells[i];
    let templateLine;
    if (sensValueCell.classList.contains("sample-value-cell")) {
      templateLine = TEMPLATE_SAMPLE_INPUT_LINE;
    } else if (sensValueCell.classList.contains("baseline-value-cell")) {
      templateLine = TEMPLATE_BASELINE_INPUT_LINE;
    } else {
      templateLine = TEMPLATE_DEVIATION_INPUT_LINE;
    }
    const newSensInputLine = templateLine.cloneNode(true);

    if (targetRow >= numOutputs - 1) {
      sensValueCell.appendChild(newSensInputLine);
    } else {
      sensValueCell.insertBefore(newSensInputLine, lSensValueCells[i].children[targetRow + 1]);
    }
  }

  // Check if we've reached the maximum number of outputs, and disable the button to add outputs if so
  if (numOutputs + 1 >= MAX_OUTPUTS) {
    disableButton($("button.add-output"));
  }

  // Check if we've passed the minimum number of outputs, and enable the button to remove outputs if so
  if (numOutputs + 1 > MIN_OUTPUTS) {
    enableButton($("button.remove-output"));
  }

  // Enable auto updates for new cells if it's turned on
  if (autoUpdating) {
    enableAutoUpdates();
  }

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateOutputSelector();
    relableOutputLabelRows();
    initNumOutputControls();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function removeOutput(e, updateAfter = true) {

  // Check that we don't already have too few outputs
  const numOutputs = getNumOutputs();
  if (numOutputs <= MIN_OUTPUTS) {
    console.error("Attempt to remove output when minimum outputs already reached");
    return;
  }

  // Determine which row to remove based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numOutputs - 1;
  } else {
    targetRow = getIndexFromEvent(e);
  }

  // Remove the row from the output label table
  const outputLabelTable = $(".output-label-table tbody")[0];
  const lOutputLabelRows = $(".output-label-row");
  outputLabelTable.removeChild(lOutputLabelRows[targetRow]);

  // Remove the input line from each cell in the sens table
  const lSensValueCells = $(".deviation-value-cell");
  for (let i = 0; i < lSensValueCells.length; ++i) {
    lSensValueCells[i].removeChild(lSensValueCells[i].children[targetRow]);
  }

  // Check if we've reached the minimum number of outputs, and disable the button to remove outputs if so
  if (numOutputs - 1 <= MIN_OUTPUTS) {
    disableButton($("button.remove-output"));
  }

  // Check if we've gone under the minimum number of outputs, and enable the button to add outputs if so
  if (numOutputs - 1 < MAX_OUTPUTS) {
    enableButton($("button.add-output"));
  }

  // Update affected properties if desired at this point
  if (updateAfter) {
    updateOutputSelector();
    relableOutputLabelRows();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function setNumRows(targetNumRows) {
  const numConditionRows = getNumConditions();
  if (numConditionRows < targetNumRows) {
    for (let i = 0; i < targetNumRows - numConditionRows; ++i) {
      addConditionRow(null, false);
    }
  } else if (numConditionRows > targetNumRows) {
    for (let i = 0; i < numConditionRows - targetNumRows; ++i) {
      removeConditionRow(null, false);
    }
  } else {
    return;
  }

  relableConditionRows();
  initNumParamControls();

  // Update the plot if desired
  if (autoUpdating) {
    generatePlot();
  }
}

function setNumOutputs(targetNumOutputs) {
  const numOutputs = getNumOutputs();
  if (numOutputs < targetNumOutputs) {
    for (let i = 0; i < targetNumOutputs - numOutputs; ++i) {
      addOutput(null, false);
    }
  } else if (numOutputs > targetNumOutputs) {
    for (let i = 0; i < numOutputs - targetNumOutputs; ++i) {
      removeOutput(null, false);
    }
  } else {
    return;
  }

  relableOutputLabelRows();
  initNumOutputControls();

  // Update the plot if desired
  if (autoUpdating) {
    generatePlot();
  }
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
        llBaselineSamples[j].push(baselineSampleVal);
      }
    }
  }

  for (let j = 0; j < numOutputs; j++) {
    const lBaselineSamples = llBaselineSamples[j];
    if (lBaselineSamples.length > 0) {
      lBaselineMeans.push(lBaselineSamples.reduce((a, b) => a + b) / lBaselineSamples.length);
    } else {
      lBaselineMeans.push(DEFAULT_BASELINE_MEAN);
    }
  }

  console.log("Baseline means: " + lBaselineMeans)
}

/**
 * Generate the plot using all the provided data
 */
function generatePlot() {

  // Set the form as clean when we generate a plot from it
  cleanDirtyForms();

  // Ensure deviation is calculated first
  calcDeviation();

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
        if (i == k) {
          lFakeData.push(minOutput)
        } else {
          lFakeData.push(maxOutput)
        }
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
  const numConditionRows = getNumConditions();
  const numOutputs = getNumOutputs();

  // Fill the column labels
  const lOutputLabelInputs = $("input.output-label-input");
  for (let j = 0; j < numOutputs; ++j) {
    let value = "Yield"
    if (numOutputs > 1) {
      value += " " + (j + 1).toString();
    }
    lOutputLabelInputs[j].value = value;
  }

  // Fill the row labels
  const lRowLabelInputs = $("input.condition-label");
  for (let i = 0; i < numConditionRows; ++i) {
    lRowLabelInputs[i].value = (i + 1).toString();
  }

  // Fill each data cell
  const minOutput = getMinOutput();
  const maxOutput = getMaxOutput();
  const lDataCells = $("input.deviation-value");
  for (let k = 0; k < lDataCells.length; ++k) {
    const e = lDataCells[k];
    e.value = minOutput + Math.random() * (maxOutput - minOutput);
  }

  if (autoUpdating) {
    generatePlot();
  }

}

function initDeviationCalc() {
  // Clear any update triggers first so we don't inadvertently double-up
  $(".trigger-deviation-update").off("change");
  $(".trigger-deviation-update").on("change", calcDeviation);
}

function enableAutoUpdates() {
  disableAutoUpdates();
  $(".trigger-chart-update").on("change", generatePlot);
  autoUpdating = true;
  generatePlot();
}

function disableAutoUpdates() {
  $(".trigger-chart-update").off("change");
  autoUpdating = false;
}

function initNumParamControls() {
  $("button.add-condition").off("click");
  $("button.remove-condition").off("click");
  $("select#num-conditions").off("change");

  $("button.add-condition").on("click", (e) => addConditionRow(e, true));
  $("button.remove-condition").on("click", (e) => removeConditionRow(e, true));
  $("select#num-conditions").on("change", (e) => setNumRows($(e.target).val()));
}

function initNumOutputControls() {
  $("button.add-output").off("click");
  $("button.remove-output").off("click");
  $("select#num-outputs").off("change");

  $("button.add-output").on("click", (e) => addOutput(e, true));
  $("button.remove-output").on("click", (e) => removeOutput(e, true));
  $("select#num-outputs").on("change", (e) => setNumOutputs($(e.target).val()));
}

$(document).ready(function () {
  // Enable all tooltips on the page
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  initDirtyForms();

  initNumParamControls();
  initNumOutputControls();

  initDeviationCalc();

  $("button#fill-random").on("click", fillRandom);
  $("button#generate-plot").on("click", generatePlot);

  $("#auto-update-toggle").on("click", function (e) {
    if ($(e.target).is(":checked")) {
      enableAutoUpdates();
    } else {
      disableAutoUpdates();
    }
  })
  enableAutoUpdates();
});