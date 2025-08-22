/**
 * This file contains code to mix colors at a specified ratio, based off of code found at
 * https://stackoverflow.com/a/62369367/5099457
 */

function hex2dec(hex) {
  return hex.match(/[^#]{2}/g).map((n) => parseInt(n, 16));
}

function rgb2hex(r, g, b) {
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  r = Math.min(r, 255);
  g = Math.min(g, 255);
  b = Math.min(b, 255);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function rgb2cmyk(r, g, b) {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, m, y);

  c = isNaN(c) ? 0 : c;
  m = isNaN(m) ? 0 : m;
  y = isNaN(y) ? 0 : y;
  k = isNaN(k) ? 0 : k;

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return [c, m, y, k];
}

function cmyk2rgb(c, m, y, k) {
  let r = c * (1 - k) + k;
  let g = m * (1 - k) + k;
  let b = y * (1 - k) + k;
  r = (1 - r) * 255 + .5;
  g = (1 - g) * 255 + .5;
  b = (1 - b) * 255 + .5;
  return [r, g, b];
}

function mix_cmyks(cmyk1, cmyk2, ratio1) {

  // Clamp the ratio between 0 and 1
  ratio1 = Math.min(Math.max(ratio1, 0), 1);

  let c = ratio1 * cmyk1[0] + (1 - ratio1) * cmyk2[0];
  let m = ratio1 * cmyk1[1] + (1 - ratio1) * cmyk2[1];
  let y = ratio1 * cmyk1[2] + (1 - ratio1) * cmyk2[2];
  let k = ratio1 * cmyk1[3] + (1 - ratio1) * cmyk2[3];

  return [c, m, y, k];
}

function mix_hexes(hex1, hex2, ratio1) {

  let rgb1 = hex2dec(hex1);
  let rgb2 = hex2dec(hex2);

  let cmyk1 = rgb2cmyk(rgb1);
  let cmyk2 = rgb2cmyk(rgb2);

  let cmyk_mix = mix_cmyks(cmyk1, cmyk2, ratio1);

  let rgb_mix = cmyk2rgb(...cmyk_mix);
  let hex_mix = rgb2hex(...rgb_mix);

  return hex_mix;
}