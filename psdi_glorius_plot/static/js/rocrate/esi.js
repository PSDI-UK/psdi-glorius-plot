const ORCID_URL_BASE = "https://orcid.org/";

/**
 * 
 * @param {*} rocrateInfo 
 * @returns 
 */
export function makeESI(rocrateInfo) {
  const docStyles = {
    header: {
      fontSize: 21,
      bold: true
    },
    subheader: {
      fontSize: 18,
      bold: true
    }
  }
  const defaultStyle = {
    fontSize: 16
  };

  const docContent = [
    {
      text: rocrateInfo.title.txt,
      style: 'header'
    },
    "",
    {
      text: "Bibliographic Information",
      style: 'subheader'
    },
    "",
    {
      text: rocrateInfo.bibInfo.esiInfo
    }
  ];
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