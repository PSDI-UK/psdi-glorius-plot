import { makeCsv } from "../io.js"

/**
 * Makes the CSV-formatted text of a table providing the descriptions of test conditions, given user input
 * @param {Array<Array<String>>} lCondDescs List of two element pairs, where the first is the condition label, and the
 *                                          second is the condition description
 * @returns {String}
 */
export function makeCondDescTable(lCondDescs) {
  let lRows = [["Test parameter", "Experimental conditions"]];

  lCondDescs.forEach((row) => {
    lRows.push(row);
  })

  return {
    arr: lRows,
    csv: makeCsv(lRows)
  };
}