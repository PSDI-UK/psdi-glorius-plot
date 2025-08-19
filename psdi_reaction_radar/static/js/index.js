/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms, cleanDirtyForms } from "./common.js";

const MIN_ROWS = 3;
const MAX_ROWS = 12;

const MIN_COLS = 1;
const MAX_COLS = 5;

// Sort mode: 0 - as entered, 1 - ascending, -1 - descending
const SORT_MODE = 0;

// Plot styling
const PLOT_MIN = -100;
const PLOT_MAX = 50;
const L_BORDER_DASHES = [[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BORDER_WIDTH = 4;
const L_BG_COLORS = ["#20A020FF", "#70FF70", "#FFFFFF", "#FFFFFF", "#FFC0C0", "#FFA0A0", "#FF8080"];
const DATA_BG_COLOR = ["#FFFFFF00"]
const L_BG_COLOR_BOUNDS = [50, 25, 0, -25, -50, -75, -100];
const L_BG_ORDER = [3, 2, 1, 1, 2, 3, 4];
const NUM_BG_COLORS = L_BG_COLORS.length;
const GRID_WIDTH = 1;
const GRID_COLOR = "#00000080";
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

function addRow() {

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

}

function removeRow() {

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

}

function addColumn() {

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

}

function removeColumn() {

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

}

function generatePlot() {

  // Set the form as clean when we generate a plot from it
  cleanDirtyForms();

  // Collect information from the table

  const numRows = getNumRows();
  const numCols = getNumValueCols();

  const lColLabels = [];
  const llData = [];
  const lOrder = [];
  const lBorderColors = [];
  const lBorderWidths = [];
  const lBackgroundColors = [];
  const lFill = [];
  const lBorderDashes = [];

  // Make fake data for each background color
  for (let k = 0; k < NUM_BG_COLORS; ++k) {
    lColLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numRows; ++i) {
      lFakeData.push(L_BG_COLOR_BOUNDS[k]);
    }
    llData.push(lFakeData);
    lOrder.push(L_BG_ORDER[k]);
    lBorderColors.push(GRID_COLOR);
    lBorderWidths.push(GRID_WIDTH);
    lBackgroundColors.push(L_BG_COLORS[k]);
    lFill.push(true);
    lBorderDashes.push([]);
  }

  // Make fake data for each axis line we want to draw
  for (let k = 0; k < numRows; ++k) {
    lColLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numRows; ++i) {
      if (i == k) {
        lFakeData.push(PLOT_MIN)
      } else {
        lFakeData.push(PLOT_MAX)
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
  lRowData.sort(function (a, b) {
    return (a.data[0] - b.data[0]) * SORT_MODE;
  });

  // Add the sorted data to the main data array, and update the row labels
  for (let i = 0; i < numRows; ++i) {
    lRowLabels[i] = lRowData[i].label;
    for (let j = 0; j < numCols; ++j) {
      llData[NUM_BG_COLORS + numRows + j].push(lRowData[i].data[j]);
    }
  }

  const lDatasets = [];
  for (let j = 0; j < NUM_BG_COLORS + numRows + numCols; ++j) {
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

  if (radarChart === null) {
    radarChart = new Chart("glorius-plot", {
      type: "radar",
      data: {
        labels: lRowLabels,
        datasets: lDatasets,
      },
      options: {
        scales: {
          r: {
            min: PLOT_MIN,
            max: PLOT_MAX,
            reverse: true,
            ticks: {
              stepSize: 25,
              z: 2,
            },
            pointLabels: {
              font: {
                size: 16
              }
            }
          }
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
    radarChart.update();
  }

}

$(document).ready(function () {
  initDirtyForms();

  $("button.add-row").click(addRow);
  $("button.remove-row").click(removeRow);
  $("button.add-column").click(addColumn);
  $("button.remove-column").click(removeColumn);

  $("button#generate-plot").click(generatePlot);
});