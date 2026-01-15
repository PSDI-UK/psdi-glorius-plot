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