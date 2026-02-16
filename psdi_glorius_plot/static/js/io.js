import { cleanDirtyForms } from "./dirty-forms.js";

/**
 * Export the chart in the desired format
 * @param {string} format 
 */
export function exportImage(chartSelector, format) {

  // Set the form as clean the user downloads the image
  cleanDirtyForms();

  $(chartSelector)[0].toBlob((blob) => {
    let objectURL = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = objectURL;
    link.download = "glorius_plot." + format;
    link.click();

  }, "image/" + format);
}

/**
 * Save an object as a stringified JSON
 * @param {Object} obj 
 * @param {string} filename 
 */
export function saveObject(obj, filename) {
  let blob = new Blob([JSON.stringify(obj)], { type: "text/plain;charset=utf-8" });
  saveBlob(blob, filename);
}

/**
 * Save a blob to a file
 * @param {Object} blob 
 * @param {string} filename 
 */
export function saveBlob(blob, filename) {
  let link = document.createElement('a');
  link.href = URL.createObjectURL(blob);;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function loadObject(file, callbackSuccess, callbackError = (e) => alert(e.target.error.name)) {
  let reader = new FileReader();

  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    callbackSuccess(data);
  };

  reader.onerror = callbackError;

  reader.readAsText(file);
}

/**
 * Makes a string safe to be included as an element in a CSV file, wrapping it in quotes if necessary and escaping
 * any existing quotes
 * @param {String} s
 * @returns {String}
 */
export function csvSafe(s) {
  s = s.toString();
  if (!s.includes(","))
    return s;
  s = s.replaceAll('"', '""');
  s = '"' + s + '"';
  return s;
}

/**
 * Convert an array of arrays into the text contents of a CSV table
 * @param {Array<Array<String>>} lRows 
 * @returns {String}
 */
export function makeCsv(lRows) {
  let csv = "";

  lRows.forEach((lCells) => {
    if (csv)
      csv += "\n";

    for (let i = 0; i < lCells.length; ++i) {
      if (i > 0)
        csv += ","
      csv += csvSafe(lCells[i]);
    }
  })
  return csv;
}