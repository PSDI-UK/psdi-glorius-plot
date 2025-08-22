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

const MIN_COLS = 1;
const MAX_COLS = 5;

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

const TEMPLATE_HEADING = $("th.output-heading")[0].cloneNode(true);
const TEMPLATE_LABEL_INPUT = $("td:has(> input.sens-label)")[0].cloneNode(true);
const TEMPLATE_VALUE_INPUT = $("td:has(> input.sens-value)")[0].cloneNode(true);

function getNumRows() {
  return $("table.sens-table tr.sens-row").length;
}

function getNumValueCols() {
  return $("table.sens-table tr.header th.output-heading").length;
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

function updateColSelector() {
  $("select#num-cols").val(getNumValueCols()).change();
}

function addRow(updateAfter = true) {

  // Check that we don't already have too many rows
  const numRows = getNumRows();
  if (numRows >= MAX_ROWS) {
    console.error("Attempt to add row when maximum rows already reached");
    return;
  }

  const numValueCols = getNumValueCols();

  // Construct a new row
  const newRow = document.createElement('tr');
  newRow.classList.add("sens-row");

  newRow.appendChild(TEMPLATE_LABEL_INPUT.cloneNode(true));

  for (let i = 0; i < numValueCols; ++i) {
    newRow.appendChild(TEMPLATE_VALUE_INPUT.cloneNode(true));
  }

  // Add the new row to the table
  $("table.sens-table tbody")[0].insertBefore(newRow, $("table.sens-table tr.button-row")[0]);

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

  let lastRow = $("table.sens-table tr.sens-row").get(-1);
  $("table.sens-table tbody")[0].removeChild(lastRow);

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

function addColumn(updateAfter = true) {

  // Check that we don't already have too many columns
  const numCols = getNumValueCols();
  if (numCols >= MAX_COLS) {
    console.error("Attempt to add column when maximum columns already reached");
    return;
  }

  const numRows = getNumRows();
  const lRows = $("table.sens-table tr.sens-row");

  // Add a new heading cell
  const newHeadingCell = TEMPLATE_HEADING.cloneNode(true);
  newHeadingCell.children[0].value = "";

  const headerRow = $("table.sens-table tr.header")[0];
  const headerButtonsCell = $("table.sens-table tr.header td.button-column")[0];

  headerRow.insertBefore(newHeadingCell, headerButtonsCell);

  // Add a new cell to each row
  for (let i = 0; i < numRows; ++i) {
    lRows[i].appendChild(TEMPLATE_VALUE_INPUT.cloneNode(true));
  }

  // Check if we've reached the maximum number of columns, and disable the button to add columns if so
  if (numCols + 1 >= MAX_COLS) {
    disableButton($("button.add-column"));
  }

  // Check if we've passed the minimum number of columns, and enable the button to remove columns if so
  if (numCols + 1 > MIN_COLS) {
    enableButton($("button.remove-column"));
  }

  // Enable auto updates for new cells if it's turned on
  if (autoUpdating) {
    enableAutoUpdates();
  }

  // Update the cols selector if desired
  if (updateAfter) {
    updateColSelector();
  }

  // Update the plot if desired
  if (updateAfter && autoUpdating) {
    generatePlot();
  }
}

function removeColumn(updateAfter = true) {

  // Check that we don't already have too few columns
  const numCols = getNumValueCols();
  if (numCols <= MIN_COLS) {
    console.error("Attempt to remove column when minimum columns already reached");
    return;
  }

  const numRows = getNumRows();
  const lRows = $("table.sens-table tr.sens-row");

  // Remove the last heading cell
  const headerRow = $("table.sens-table tr.header");
  const headerButtonsCell = headerRow.children("th.output-heading").get(-1);
  headerRow[0].removeChild(headerButtonsCell);

  // Remove the last cell from each row
  for (let i = 0; i < numRows; ++i) {
    lRows[i].removeChild(lRows[i].lastChild);
  }

  // Check if we've reached the minimum number of columns, and disable the button to remove columns if so
  if (numCols - 1 <= MIN_COLS) {
    disableButton($("button.remove-column"));
  }

  // Check if we've gone under the minimum number of columns, and enable the button to add columns if so
  if (numCols - 1 < MAX_COLS) {
    enableButton($("button.add-column"));
  }

  // Update the cols selector if desired
  if (updateAfter) {
    updateColSelector();
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

function setNumCols(targetNumValueCols) {
  const numCols = getNumValueCols();
  if (numCols < targetNumValueCols) {
    for (let i = 0; i < targetNumValueCols - numCols; ++i) {
      addColumn(false);
    }
  } else if (numCols > targetNumValueCols) {
    for (let i = 0; i < numCols - targetNumValueCols; ++i) {
      removeColumn(false);
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
  bandWidth = Math.min(Math.max(bandWidth, 0.01), 1000);
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
  const numCols = getNumValueCols();

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

  // Get the column labels, and also set other fixed data for normal datasets
  const lColLabelCells = $("table.sens-table tr.header th.output-heading");
  for (let j = 0; j < numCols; ++j) {
    lColLabels.push(lColLabelCells[j].children[0].value);
    lOrder.push(0);
    lBorderColors.push("black");
    lBorderWidths.push(BORDER_WIDTH);
    lBackgroundColors.push(DATA_BG_COLOR);
    lFill.push(false);
    lBorderDashes.push(L_BORDER_DASHES[j]);
  }

  // Get the row labels
  const lRowLabels = [];
  const lRowLabelCells = $("table.sens-table tr.sens-row td input.sens-label");
  for (let i = 0; i < numRows; ++i) {
    lRowLabels.push(lRowLabelCells[i].value);
  }

  // Get each column of data
  for (let j = 0; j < numCols; ++j) {
    llData.push([]);
  }

  const lSensRows = $("table.sens-table tr.sens-row");
  const lRowData = [];
  for (let i = 0; i < numRows; ++i) {
    let lCells = lSensRows.eq(i).find("td input.sens-value");
    let lSingleRowData = [];
    for (let j = 0; j < numCols; ++j) {
      lSingleRowData.push(lCells[j].value);
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
    for (let j = 0; j < numCols; ++j) {
      llData[numBgColors + numAxisLines + j].push(lRowData[i].data[j]);
    }
  }

  const lDatasets = [];
  for (let j = 0; j < numBgColors + numAxisLines + numCols; ++j) {
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

function enableAutoUpdates() {
  $(".trigger-update").on("change", generatePlot);
  autoUpdating = true;
  generatePlot();
}

function disableAutoUpdates() {
  $(".trigger-update").off("change");
  autoUpdating = false;
}

$(document).ready(function () {
  initDirtyForms();

  $("button.add-row").on("click", () => addRow(true));
  $("button.remove-row").on("click", () => removeRow(true));
  $("button.add-column").on("click", () => addColumn(true));
  $("button.remove-column").on("click", () => removeColumn(true));

  $("button#generate-plot").on("click", generatePlot);

  $("select#num-rows").on("change", function (e) {
    setNumRows($(e.target).val());
  })
  $("select#num-cols").on("change", function (e) {
    setNumCols($(e.target).val());
  })

  $("#auto-update-toggle").on("click", function (e) {
    if ($(e.target).is(":checked")) {
      enableAutoUpdates();
    } else {
      disableAutoUpdates();
    }
  })
  enableAutoUpdates();
});