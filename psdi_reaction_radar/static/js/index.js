/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms, cleanDirtyForms } from "./common.js";
import { mix_hexes } from "./color.js"

const MIN_ROWS = 3;
const MAX_ROWS = 12;

const MIN_OUTPUTS = 1;
const MAX_OUTPUTS = 5;

// Table values and placeholders
const OUTPUT_LABEL_TEXT = "Output {N} Label:";
const OUTPUT_1_DEFAULT_VALUE = "Yield";
const OUTPUT_N_DEFAULT_VALUE = "";

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
const TEMPLATE_INPUT_LINE = $(".sens-input-line")[0].cloneNode(true);

function getNumRows() {
  return $(".sens-row").length;
}

function getNumOutputs() {
  return $(".output-label-row").length;
}

function getNumSamples() {
  return $(".header").length - 1;
}

function disableButton(button) {
  button.prop({ disabled: true });
}

function enableButton(button) {
  button.prop({ disabled: false });
}

function updateRowSelector() {
  $("select#num-rows").val(getNumRows()).change();
}

function updateOutputSelector() {
  $("select#num-outputs").val(getNumOutputs()).change();
}

function addRow(updateAfter = true) {

  // Check that we don't already have too many rows
  const numRows = getNumRows();
  if (numRows >= MAX_ROWS) {
    console.error("Attempt to add row when maximum rows already reached");
    return;
  }

  const numOutputs = getNumOutputs();

  // Construct a new row by copying the first and clearing its input
  const newRow = $(".sens-row")[0].cloneNode(true);
  $(newRow).find(".sens-label").val("");
  $(newRow).find(".sens-value").val("0");

  // Add the new row to the table
  $(".sens-table tbody")[0].insertBefore(newRow, $(".button-row")[0]);

  // Check if we've reached the maximum number of rows, and disable the button to add rows if so
  if (numRows + 1 >= MAX_ROWS) {
    disableButton($("button.add-row"));
  }

  // Check if we've passed the minimum number of rows, and enable the button to remove rows if so
  if (numRows + 1 > MIN_ROWS) {
    enableButton($("button.remove-row"));
  }

  // Enable auto updates for new cells if it's turned on
  if (autoUpdating) {
    enableAutoUpdates();
  }

  // Update the rows selector if desired
  if (updateAfter) {
    updateRowSelector();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function removeRow(updateAfter = true) {

  // Check that we don't already have too few
  const numRows = getNumRows();
  if (numRows <= MIN_ROWS) {
    console.error("Attempt to remove row when minimum rows already reached");
    return;
  }

  let lastRow = $(".sens-row").get(-1);
  $(".sens-table tbody")[0].removeChild(lastRow);

  // Check if we've reached the minimum number of rows, and disable the button to remove rows if so
  if (numRows - 1 <= MIN_ROWS) {
    disableButton($("button.remove-row"));
  }

  // Check if we've gotten under the minimum number of rows, and enable the button to add rows if so
  if (numRows - 1 < MAX_ROWS) {
    enableButton($("button.add-row"));
  }

  // Update the rows selector if desired
  if (updateAfter) {
    updateRowSelector();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

/**
 * Relabel all the output rows after one is added or removed
 */
function relableOutputRows() {
  const numOutputs = getNumOutputs();
  const lOutputLabelRows = $(".output-label-row");
  for (let j = 0; j < numOutputs; j++) {
    const outputLabelRow = lOutputLabelRows[j];
    const rowNumber = (j + 1).toString();

    const outputLabelLabel = outputLabelRow.children[0].children[0];
    outputLabelLabel.textContent = OUTPUT_LABEL_TEXT.replace("{N}", rowNumber);
    outputLabelLabel.for = "ol" + rowNumber;

    const outputLabelInput = outputLabelRow.children[1].children[0];
    outputLabelInput.id = "ol" + rowNumber;

    const outputLabelRemoveButton = outputLabelRow.children[2].children[0];
    outputLabelRemoveButton.id = "remove-ob" + rowNumber;
    const outputLabelAddButton = outputLabelRow.children[2].children[1];
    outputLabelAddButton.id = "add-ob" + rowNumber;
  }
}

function addOutput(e, updateAfter = true) {

  // Check that we don't already have too many outputs
  const numOutputs = getNumOutputs();
  if (numOutputs >= MAX_OUTPUTS) {
    console.error("Attempt to add output when maximum outputs already reached");
    return;
  }

  const newOutputNumber = (numOutputs + 1).toString();

  // Set up the new output label row
  const newOutputLabelRow = TEMPLATE_OUTPUT_LABEL_ROW.cloneNode(true);
  newOutputLabelRow.children[1].children[0].value = "";

  // Determine where to add the row based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numOutputs;
  } else {
    let eId = e.target.id;
    targetRow = +eId.at(-1);
  }
  if (targetRow >= numOutputs) {
    $(".output-label-table tbody")[0].appendChild(newOutputLabelRow);
  } else {
    $(".output-label-table tbody")[0].insertBefore(newOutputLabelRow, $(".output-label-row")[targetRow]);
  }

  relableOutputRows();

  // Add a new input line to each value cell
  const lSensValueCells = $(".sens-value-cell");
  for (let i = 0; i < lSensValueCells.length; ++i) {
    const newSensInputLine = TEMPLATE_INPUT_LINE.cloneNode(true);

    if (targetRow == numOutputs) {
      lSensValueCells[i].appendChild(newSensInputLine);
    } else {
      lSensValueCells[i].insertBefore(newSensInputLine, lSensValueCells[i].children[targetRow]);
    }
  }

  // Connect the newly-added buttons to the add/remove functions
  initNumOutputControls();

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

  // Update the output selector if desired
  if (updateAfter) {
    updateOutputSelector();
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

  const numRows = getNumRows();
  const lRows = $(".sens-row");

  // Determine which row to remove based on which button was clicked
  let targetRow;
  if (e === null) {
    targetRow = numOutputs - 1;
  } else {
    let eId = e.target.id;
    targetRow = +eId.at(-1) - 1;
  }

  // Remove the row from the output label table
  const outputLabelTable = $(".output-label-table tbody")[0];
  const lOutputLabelRows = $(".output-label-row");
  outputLabelTable.removeChild(lOutputLabelRows[targetRow]);

  relableOutputRows();

  // Remove the input line from each cell in the sens table
  const lSensValueCells = $(".sens-value-cell");
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

  // Update the output selector if desired
  if (updateAfter) {
    updateOutputSelector();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function setNumRows(targetNumRows) {
  const numRows = getNumRows();
  if (numRows < targetNumRows) {
    for (let i = 0; i < targetNumRows - numRows; ++i) {
      addRow(false);
    }
  } else if (numRows > targetNumRows) {
    for (let i = 0; i < numRows - targetNumRows; ++i) {
      removeRow(false);
    }
  }

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
  }

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
 * Generate the plot using all the provided data
 */
function generatePlot() {

  // Set the form as clean when we generate a plot from it
  cleanDirtyForms();

  // Collect info from the settings and determine data based on them
  const numRows = getNumRows();
  const numOutputs = getNumOutputs();
  const numSamples = getNumSamples();

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
  const lColLabels = [];
  const llData = [];
  const lOrder = [];
  const lBorderColors = [];
  const lBorderWidths = [];
  const lBackgroundColors = [];
  const lFill = [];
  const lBorderDashes = [];

  // Make fake data for each background color

  for (let k = 0; k < numBgColorsHi; ++k) {
    lColLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numRows; ++i) {
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
    lColLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numRows; ++i) {
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
    numAxisLines = numRows;
    for (let k = 0; k < numRows; ++k) {
      lColLabels.push("");
      let lFakeData = [];
      for (let i = 0; i < numRows; ++i) {
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
    lColLabels.push(lOutputLabelInputs[j].value);
    lOrder.push(0);
    lBorderColors.push("black");
    lBorderWidths.push(BORDER_WIDTH);
    lBackgroundColors.push(DATA_BG_COLOR);
    lFill.push(false);
    lBorderDashes.push(L_BORDER_DASHES[j]);
  }

  // Get the row labels
  const lRowLabels = [];
  const lRowLabelCells = $(".sens-label");
  for (let i = 0; i < numRows; ++i) {
    lRowLabels.push(lRowLabelCells[i].value);
  }

  // Get data for each output
  for (let j = 0; j < numOutputs; ++j) {
    llData.push([]);
  }

  const lSensRows = $(".sens-row");
  const lRowData = [];
  for (let i = 0; i < numRows; ++i) {
    let lSingleRowData = [];
    const lCells = lSensRows.eq(i).find(".sens-value-cell");
    // TODO: Add loop over cells here
    const lInputs = lCells.eq(0).find("input.sens-value");
    for (let j = 0; j < numOutputs; ++j) {
      lSingleRowData.push(lInputs[j].value);
    }
    lRowData.push({
      label: lRowLabels[i],
      data: lSingleRowData
    })
  }

  // Sort the data by the first value, depending on the sort mode
  let sort_mode = getDataSorting();
  lRowData.sort(function (a, b) {
    return (a.data[0] - b.data[0]) * sort_mode;
  });

  // Add the sorted data to the main data array, and update the row labels
  for (let i = 0; i < numRows; ++i) {
    lRowLabels[i] = lRowData[i].label;
    for (let j = 0; j < numOutputs; ++j) {
      llData[numBgColors + numAxisLines + j].push(lRowData[i].data[j]);
    }
  }

  const lDatasets = [];
  for (let j = 0; j < numBgColors + numAxisLines + numOutputs; ++j) {
    lDatasets.push({
      label: lColLabels[j],
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
        labels: lRowLabels,
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
      labels: lRowLabels,
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
  const numRows = getNumRows();
  const numOutputs = getNumOutputs();

  // Fill the column labels
  const lOutputLabelInputs = $("input.output-label-input");
  for (let j = 0; j < numOutputs; ++j) {
    lOutputLabelInputs[j].value = "Yield " + (j + 1).toString();
  }

  // Fill the row labels
  const lRowLabelInputs = $("input.sens-label");
  for (let i = 0; i < numRows; ++i) {
    lRowLabelInputs[i].value = (i + 1).toString();
  }

  // Fill each data cell
  const minOutput = getMinOutput();
  const maxOutput = getMaxOutput();
  const lDataCells = $("input.sens-value");
  for (let k = 0; k < lDataCells.length; ++k) {
    const e = lDataCells[k];
    e.value = minOutput + Math.random() * (maxOutput - minOutput);
  }

  if (autoUpdating) {
    generatePlot();
  }

}

function enableAutoUpdates() {
  disableAutoUpdates();
  $(".trigger-update").on("change", generatePlot);
  autoUpdating = true;
  generatePlot();
}

function disableAutoUpdates() {
  $(".trigger-update").off("change");
  autoUpdating = false;
}

function initNumParamControls() {
  $("button.add-row").off("click");
  $("button.remove-row").off("click");
  $("select#num-rows").off("change");

  $("button.add-row").on("click", () => addRow(true));
  $("button.remove-row").on("click", () => removeRow(true));
  $("select#num-rows").on("change", function (e) {
    setNumRows($(e.target).val());
  });
}

function initNumOutputControls() {
  $("button.add-output").off("click");
  $("button.remove-output").off("click");
  $("select#num-outputs").off("change");

  $("button.add-output").on("click", (e) => addOutput(e, true));
  $("button.remove-output").on("click", (e) => removeOutput(e, true));
  $("select#num-outputs").on("change", function (e) {
    setNumOutputs($(e.target).val());
  });
}

$(document).ready(function () {
  // Enable all tooltips on the page
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  initDirtyForms();

  initNumParamControls();
  initNumOutputControls();

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