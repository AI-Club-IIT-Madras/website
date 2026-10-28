import { readFile, writeFile } from 'node:fs/promises';

// Preserve the supplied PNG artwork verbatim. SVG viewports remove transparent margins
// and isolate the brain without resampling or redrawing the original linework.
const directory = new URL('../public/images/', import.meta.url);
const source = await readFile(new URL('ai-club-logo-white-original.png', directory));
const embeddedImage = `<image width="1920" height="1080" href="data:image/png;base64,${source.toString('base64')}"/>`;

/** @param {string} viewBox @param {number} width @param {number} height @param {boolean} adaptive */
function wrap(viewBox, width, height, adaptive = false) {
  const theme = adaptive
    ? '<style>image{filter:brightness(0)}@media(prefers-color-scheme:dark){image{filter:none}}</style>'
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${theme}${embeddedImage}</svg>\n`;
}

await writeFile(new URL('ai-club-logo-white.svg', directory), wrap('203 145 1450 777', 1450, 777));
// Brain bounds: x203–983, y145–921. Square viewport includes 24px breathing room.
await writeFile(new URL('ai-club-brain.svg', directory), wrap('179 119 829 829', 829, 829, true));
