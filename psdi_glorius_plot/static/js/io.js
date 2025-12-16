import { saveAs } from 'file-saver';

/**
 * Export the chart in the desired format
 * @param {string} format 
 */
export function exportImage(format) {

  // Set the form as clean the user downloads the image
  cleanDirtyForms();

  $(CHART_SELECTOR)[0].toBlob((blob) => {
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
  var blob = new Blob([JSON.stringify(obj)], { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename);
}