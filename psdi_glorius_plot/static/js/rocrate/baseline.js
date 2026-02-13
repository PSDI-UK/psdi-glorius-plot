/**
 * Get the text content of the baseline (standard conditions) description file, given the user-provided description of
 * it
 * @param {String} baselineDesc 
 * @returns {String}
 */
export function makeBaselineDesc(baselineDesc) {
  const text = `<!DOCTYPE html>
<html>
<body>
<h2>Standard conditions</h2>
<p>
${baselineDesc}
</p>
</html>`;
  return text;
}