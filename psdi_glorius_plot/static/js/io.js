import { cleanDirtyForms } from "./dirty-forms.js";
import { renderingComplete } from "./formatted-labels.js";

/**
 * Export the chart in the desired format
 * @param {string} format 
 */
export async function exportImage(chartSelector, format, spinnerSelector = null) {

  if (spinnerSelector) {
    $(spinnerSelector).removeClass("hidden");
  }

  let renderFailed = false;
  await renderingComplete().catch(reason => {
    renderFailed = true;
    $(spinnerSelector).addClass("hidden");
    alert("Error rendering plot: " + reason);
  });
  if (renderFailed)
    return;

  // Set the form as clean when the user downloads the image
  cleanDirtyForms();

  $(chartSelector)[0].toBlob((blob) => {
    let objectURL = URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.href = objectURL;
    link.download = "glorius_plot." + format;

    if (spinnerSelector) {
      $(spinnerSelector).addClass("hidden");
    }

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

export async function loadDataURL(file) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result)
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
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