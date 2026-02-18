import { loadDataURL } from "../io.js";

const ORCID_URL_BASE = "https://orcid.org/";

let pdfFontsLoaded = false;

function initPdfFonts(siteUrl) {
  if (pdfFontsLoaded)
    return
  pdfFontsLoaded = true;

  var fonts = {
    Arial: {
      normal: siteUrl + "static/fonts/Arial Regular.ttf",
      bold: siteUrl + "static/fonts/Arial Bold.ttf",
      italics: siteUrl + "static/fonts/Arial Italic.ttf",
      bolditalics: siteUrl + "static/fonts/Arial Bold Italic.ttf"
    }
  };

  pdfMake.addFonts(fonts);
}

/**
 * 
 * @param {*} rocrateInfo 
 * @returns 
 */
export async function makeESI(rocrateInfo) {

  if (rocrateInfo.reactionSchemeImg) {
    // The Image needs to be fully loaded before we create the PDF, so we start loading as early as possible, and wait
    // on it as long as possible, then fill in the info in the document tree when it's ready
    var reactionSchemeImgPromise = loadDataURL(rocrateInfo.reactionSchemeImg);
  }

  // Load fonts for the PDF renderer
  initPdfFonts(window.location.protocol + "//" + window.location.host + "/");

  const docStyles = {
    header: {
      fontSize: 18,
      bold: true
    },
    subheader: {
      fontSize: 14,
      bold: true,
      margin: [0, 20, 0, 8]
    }
  }
  const defaultStyle = {
    font: "Arial",
    fontSize: 12
  };

  // Create the document contents, starting with the main header and the (always-present) Biblio Info section
  const docContent = [
    {
      text: rocrateInfo.title.txt,
      style: "header"
    },
    {
      text: "Bibliographic Information",
      style: "subheader"
    },
    {
      text: rocrateInfo.bibInfo.esiInfo
    }
  ];

  // Append other sections to the document content, if they're going to be present
  if (rocrateInfo.baselineDesc) {
    docContent.push(
      {
        text: "Standard conditions",
        style: "subheader"
      },
      // TODO: Need to implement a function to format HTML into a format that can be used with PDFmake. Using MD for now
      rocrateInfo.baselineDesc.md
    )
  }

  if (rocrateInfo.condDescTable) {
    // TODO: Format table cells

    docContent.push(
      {
        text: "Preparation of sensitivity assessment of reaction",
        style: "subheader"
      },
      {
        layout: "noBorders",
        table: {
          headerRows: 1,
          body: rocrateInfo.condDescTable.arr
        }
      }
    )
  }

  if (rocrateInfo.reactionSchemeImg) {

    // Use a function-scope variable here so we can reference it later when we're ready to fill in with the loaded
    // DataURL
    var reactionSchemeImgInfo = {
      image: null,
      fit: [500, 700]
    }

    docContent.push(
      {
        layout: "noBorders",
        table: {
          headerRows: 2,
          keepWithHeaderRows: true,
          body: [
            [{
              text: "Reaction",
              style: "subheader"
            }],
            [reactionSchemeImgInfo],
          ]
        }
      }
    )

  }

  var gloriusPlotImgInfo = {
    image: null,
    fit: [500, 700]
  }

  docContent.push(
    {
      text: "Results of sensitivity of reaction",
      style: "subheader"
    },
    {
      layout: "noBorders",
      table: {
        headerRows: 1,
        body: rocrateInfo.sensitivityTable.arr
      }
    },
    {
      layout: "noBorders",
      table: {
        headerRows: 2,
        keepWithHeaderRows: true,
        body: [
          [{
            text: "Glorius plot",
            style: "subheader"
          }],
          [gloriusPlotImgInfo],
        ]
      }
    }

  )

  // Just before creating the PDF, we wait and load the DataURLs for the images

  // The gloriusPlot is provided as a promise for a Blob, but the current version of pdfMake only accepts paths to
  // images and dataURLs, so we convert the Blob to the latter using the FileReader API
  gloriusPlotImgInfo.image = await rocrateInfo.gloriusPlotPromise.then((blob) => {
    return new Promise((resolve, reject) => {
      var fr = new FileReader();
      fr.onload = (e) => { resolve(e.target.result); }
      fr.onerror = (e) => { reject(e.target.result); }
      fr.readAsDataURL(blob);
    });
  });

  if (rocrateInfo.reactionSchemeImg) {
    reactionSchemeImgInfo.image = await reactionSchemeImgPromise;
  }

  const pdf = pdfMake.createPdf({ content: docContent, styles: docStyles, defaultStyle: defaultStyle }).getBlob();
  return pdf;
}

export function formatESIBibInfo(lNamesAndORCIDs, contactEmail) {

  const lFormattedNames = [];
  lNamesAndORCIDs.forEach(([name, orcId]) => {

    // If no name is present, skip this entry
    if (!name)
      return;

    // Check how the ORCID is formatted, and always print with the full URL
    if (!orcId.startsWith(ORCID_URL_BASE))
      orcId = ORCID_URL_BASE + orcId;

    lFormattedNames.push({ text: name, link: orcId, decoration: 'underline' })

  });

  const lTextSegments = [];

  // Format differently depending on if we have, none, one, two, or three or more authors
  if (lFormattedNames.length == 0) {
    return ["N/A"]
  } else if (lFormattedNames.length == 1) {
    lTextSegments.push("Author: ", lFormattedNames[0], ".");
  } else if (lFormattedNames.length == 2) {
    lTextSegments.push("Authors: ", lFormattedNames[0], " and ", lFormattedNames[1], ".");
  } else {
    lTextSegments.push("Authors: ");
    for (let i = 0; i < lFormattedNames.length; ++i) {
      if (i < lFormattedNames.length - 1)
        lTextSegments.push(lFormattedNames[i], ", ");
      else
        lTextSegments.push("and ", lFormattedNames[i], ".");
    }
    lTextSegments.push(".");
  }

  if (contactEmail) {
    lTextSegments.push(" Contact: ", { text: contactEmail, link: `mailto:${contactEmail}`, decoration: 'underline' },
      ".");
  }

  return lTextSegments;
}