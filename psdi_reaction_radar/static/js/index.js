/**
 * @file index.js
 * @date 2025-08-06
 * @author Bryan Gillis
 *
 * JavaScript code to handle the special functionality of the index.html page
 */

import { initDirtyForms } from "./common.js";

const MIN_ROWS = 3;
const MAX_ROWS = 12;

const MIN_COLS = 1;
const MAX_COLS = 5;

// Plot styling
const L_BORDER_DASHES = [[], [], [], [], [], [], [], [],
[], [6, 6], [4, 4], [2, 2], [1, 1]];
const BORDER_WIDTH = 2;
const L_BG_COLORS = ["#20A020FF", "#70FF70", "#FFFFFF", "#FFFFFF", "#FFC0C0", "#FFA0A0", "#FF8080",
  "#FF4040"];
const L_BG_COLOR_BOUNDS = [50, 37.5, 12.5, -12.5, -37.5, -62.5, -87.5, -100];
const L_BG_ORDER = [3, 2, 1, 1, 2, 3, 4, 5]
const NUM_BG_COLORS = L_BG_COLORS.length;
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

  // Collect information from the table

  const numRows = getNumRows();
  const numCols = getNumValueCols();

  const lColLabels = [];
  const llData = [];
  const lOrder = [];
  const lBorderColors = [];
  const lBackgroundColors = [];
  const lFill = [];

  // Make fake data for each background color
  for (let k = 0; k < NUM_BG_COLORS; ++k) {
    lColLabels.push("");
    let lFakeData = [];
    for (let i = 0; i < numRows; ++i) {
      lFakeData.push(L_BG_COLOR_BOUNDS[k]);
    }
    llData.push(lFakeData);
    lOrder.push(L_BG_ORDER[k]);
    lBorderColors.push(L_BG_COLORS[k]);
    lBackgroundColors.push(L_BG_COLORS[k]);
    lFill.push(true);
  }

  // Get the column labels, and also set other fixed data for normal datasets
  const lColLabelCells = $("table.sens-table tr.header th.output-heading");
  for (let j = 0; j < numCols; ++j) {
    lColLabels.push(lColLabelCells[j].children[0].value);
    lOrder.push(0);
    lBorderColors.push("black");
    lBackgroundColors.push("#FFFFFF00");
    lFill.push(false);
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
  for (let i = 0; i < numRows; ++i) {
    let lCells = lSensRows.eq(i).find("td input.sens-value");
    for (let j = 0; j < numCols; ++j) {
      llData[NUM_BG_COLORS + j].push(lCells[j].value)
    }
  }

  const lDatasets = [];
  for (let j = 0; j < NUM_BG_COLORS + numCols; ++j) {
    lDatasets.push({
      label: lColLabels[j],
      data: llData[j],
      order: lOrder[j],
      borderColor: lBorderColors[j],
      backgroundColor: lBackgroundColors[j],
      borderDash: L_BORDER_DASHES[j],
      borderWidth: BORDER_WIDTH,
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
            min: -100,
            max: 50,
            reverse: true,
            ticks: {
              stepSize: 25
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              boxHeight: 16,
              boxWidth: 16,
              borderRadius: 8,
              useBorderRadius: true,
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