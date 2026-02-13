import { csvSafe } from "..io.js"

/**
 * Makes the CSV-formatted text of a table providing the descriptions of test conditions, given user input
 * @param {Array<Array<String>>} lCondDescs List of two element pairs, where the first is the condition label, and the
 *                                          second is the condition description
 * @returns {String}
 */
export function makeCondDescTable(lCondDescs) {
  let text = "Test parameter,Experimental conditions";

  lCondDescs.forEach(([cond, desc]) => {
    text += "\n" + csvSafe(cond) + "," + csvSafe(desc)
  })

  return text;
}