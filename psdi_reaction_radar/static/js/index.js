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
  let newRow = document.createElement('tr');
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
  let newHeadingCell = TEMPLATE_HEADING.cloneNode(true);
  newHeadingCell.children[0].value = "";

  let headerRow = $("table.sens-table tr.header")[0];
  let headerButtonsCell = $("table.sens-table tr.header td.button-column")[0];

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
  let headerRow = $("table.sens-table tr.header");
  let headerButtonsCell = headerRow.children("th.output-heading").get(-1);
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

$(document).ready(function () {
  $("button.add-row").click(addRow);
  $("button.remove-row").click(removeRow);
  $("button.add-column").click(addColumn);
  $("button.remove-column").click(removeColumn);

  initDirtyForms();
});