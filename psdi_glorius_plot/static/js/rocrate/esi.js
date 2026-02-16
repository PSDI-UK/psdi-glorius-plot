
/**
 * 
 * @param {*} rocrateInfo 
 * @returns 
 */
export function makeESI(rocrateInfo) {
  let docDefinition = {
    content: [
      {
        text: rocrateInfo.title.txt,
        style: 'header',
        pageBreak: 'before'
      },
      'First paragraph',
      'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'
    ]
  };
  const pdf = pdfMake.createPdf(docDefinition).getBlob();
  return pdf;
}