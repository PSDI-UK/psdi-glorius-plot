const ORCID_URL_BASE = "https://orcid.org/";

// Shortcuts for linebreaks in the file. These need to be copied when added to the document content, e.g. with
// { ...linebreakLarge }
const linebreakLarge = { text: "", style: { fontSize: 16 } }
const linebreakMed = { text: "", style: { fontSize: 12 } }
const linebreakSmall = { text: "", style: { fontSize: 6 } }

export function initPdfFonts(siteUrl) {
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
export function makeESI(rocrateInfo) {
  const docStyles = {
    header: {
      fontSize: 14,
      bold: true
    },
    subheader: {
      fontSize: 12,
      bold: true
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
      style: 'header'
    },
    { ...linebreakLarge },
    {
      text: "Bibliographic Information",
      style: 'subheader'
    },
    { ...linebreakSmall },
    {
      text: rocrateInfo.bibInfo.esiInfo
    },
    { ...linebreakMed }
  ];

  // Append other sections to the document content, if they're going to be present
  if (rocrateInfo.baselineDesc) {
    docContent.push({
      text: "Standard conditions",
      style: 'subheader'
    },
      { ...linebreakSmall },
      // TODO: Need to implement a function to format HTML into a format that can be used with PDFmake. Using MD for now
      rocrateInfo.baselineDesc.md
    )
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