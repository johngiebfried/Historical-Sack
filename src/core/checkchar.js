/**
 * The check letter on every code.
 *
 * Luhn mod N over an alphabet without I or O, so a code never contains a
 * letter that can be mistaken for 1 or 0. It catches every single mistyped
 * character and nearly every pair of swapped neighbours. It is a guard against
 * slips and casual edits, not a lock: anyone who reads this file can forge one.
 */

export const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function checkChar(payload) {
  const s = String(payload).replace(/-/g, '').toUpperCase()
  const n = ALPHABET.length
  let factor = 2
  let sum = 0
  for (let i = s.length - 1; i >= 0; i--) {
    const cp = ALPHABET.indexOf(s[i])
    if (cp < 0) throw new Error(`Character ${s[i]} cannot appear in a code`)
    let addend = factor * cp
    factor = factor === 2 ? 1 : 2
    addend = Math.floor(addend / n) + (addend % n)
    sum += addend
  }
  return ALPHABET[(n - (sum % n)) % n]
}
