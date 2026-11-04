/**
 * The Unicode ranges the bundled font was cut to (src/fonts/MedievalSharp-subset.woff2).
 * Recut it with these same ranges if they ever change:
 *
 *   pyftsubset MedievalSharp.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2193,U+2212" \
 *     --layout-features='*' --flavor=woff2 --output-file=src/fonts/MedievalSharp-subset.woff2
 *
 * (MedievalSharp.ttf is in fourth-crusade-siege/src/fonts/; SIL Open Font Licence, see src/fonts/OFL.txt.)
 */
export const FONT_RANGES = [
  [0x20, 0x7e], // ASCII
  [0xa0, 0xff], // Latin-1: accented names
  [0x2010, 0x2027], // dashes, quotation marks, the middle dot's cousins, ellipsis
  [0x2030, 0x203a],
  [0x2190, 0x2193], // arrows
  [0x2212, 0x2212], // minus
]

export const inFont = (ch) => {
  const n = ch.codePointAt(0)
  return ch === '\n' || FONT_RANGES.some(([a, b]) => n >= a && n <= b)
}
