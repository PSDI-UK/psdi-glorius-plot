import { cleanTags } from "../formatted-labels.js";
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
      formatFromHTML(rocrateInfo.baselineDesc.html)
    )
  }

  if (rocrateInfo.condDescTable) {

    // Format table cells individually
    const condDescTableFormatted = rocrateInfo.condDescTable.arr.map((row) => {
      return row.map((cell) => {
        return formatFromHTML(cell);
      })
    });

    docContent.push(
      {
        text: "Preparation of sensitivity assessment of reaction",
        style: "subheader"
      },
      {
        layout: "noBorders",
        table: {
          headerRows: 1,
          body: condDescTableFormatted
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



  // Format table cells individually
  const sensitivityTableFormatted = rocrateInfo.sensitivityTable.arr.map((row) => {
    return row.map((cell) => {
      if (typeof cell === "string" || cell instanceof String)
        return formatFromHTML(cell);
      else
        return cell.toString();
    })
  });

  docContent.push(
    {
      text: "Results of sensitivity of reaction",
      style: "subheader"
    },
    {
      layout: "noBorders",
      table: {
        headerRows: 1,
        body: sensitivityTableFormatted
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

/**
 * Formats a string with HTML markup into an array of text segments formatted for pdfMake
 * @param {String} text 
 * @returns {Array<String>}
 */
function formatFromHTML(text) {
  text = cleanTags(text);

  // Regex which captures any of the formatting tags we're looking for, with a capturing group which notes which tag it
  // is
  const tagRegex = /<(\/?em|\/?strong|\/?u|\/?sub|\/?sup)>/gmu;

  // Per how RegEx splits are handled, the resulting string here will be alternating segments and capturing groups,
  // e.g. High <em>c</em> => ["High ", "em", "c", "/em", ""]
  const lInTextSegments = text.split(tagRegex);
  const numTags = (lInTextSegments.length - 1) / 2;

  // Early return in case there's no formatting to be done
  if (numTags == 0)
    return text;

  // Start building the output array - it will always start out unformatted
  let lOutTextSegments = [{
    text: lInTextSegments[0],
    bold: false,
    italics: false,
    sub: false,
    sup: false,
    decoration: false
  }];

  for (let i = 0; i < numTags; ++i) {
    // Use the previous segment as a base for any changes to style relative to it
    const newSegment = { ...lOutTextSegments[i] };

    // Set the text to that of the next segment
    newSegment.text = lInTextSegments[2 * i + 2];

    // Check what the tag is, and from that adjust the style as appropriate
    switch (lInTextSegments[2 * i + 1]) {
      case "em":
        newSegment.italics = true;
        break;
      case "/em":
        newSegment.italics = false;
        break;
      case "strong":
        newSegment.bold = true;
        break;
      case "/strong":
        newSegment.bold = false;
        break;
      case "u":
        newSegment.decoration = "underline";
        break;
      case "/u":
        newSegment.decoration = false;
        break;
      case "sub":
        newSegment.sub = true;
        break;
      case "/sub":
        newSegment.sub = false;
        break;
      case "sup":
        newSegment.sup = true;
        break;
      case "/sup":
        newSegment.sup = false;
        break;
      default:
    }
    lOutTextSegments.push(newSegment);
  }

  return { text: lOutTextSegments };
}