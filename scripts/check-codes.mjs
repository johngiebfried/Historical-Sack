/**
 * Codes survive the round trip, and the check letter catches slips.
 *
 * Every path through every place (5 regions x positions x 64 choice
 * combinations) is encoded and decoded. The expected totals are summed here
 * straight from the data, not through run.js, so a fault in the scoring code
 * cannot hide behind itself.
 */
import { core, readJSON, suite } from './lib/env.mjs'

const t = suite('check-codes')
const { makeContent } = await core('content.js')
const { newRun, pick } = await core('run.js')
const { encodeResult, decodeResult, encodeJoin, decodeJoin, normalize } = await core('codes.js')
const { ALPHABET } = await core('checkchar.js')

const data = readJSON('src/data/sack.json')
const roster = readJSON('src/data/roster.json')
const content = makeContent(data)
const raw = new Map(data.questions.map((q) => [q.id, q]))

function expectedTotals(region, position, picks) {
  // Built from the data by hand: region order from the data, choices looked up by key.
  const order = data.regions[region].order.map((s) => (s === 'U' ? `${region}-${position}` : `${region}-${s}`))
  let marks = 0, fama = 0, nefas = 0
  order.forEach((id, i) => {
    const c = raw.get(id).choices.find((x) => x.key === picks[i])
    marks += c.marks; fama += c.fama; nefas += c.nefas
  })
  return { marks, fama, nefas, collected: Math.max(0, marks), seq: order }
}

const KEYS = ['A', 'B', 'C', 'D']
let paths = 0
for (const region of Object.keys(data.regions)) {
  const r = data.regions[region]
  const positions = [...Array.from({ length: r.positions }, (_, i) => i + 1), ...(r.special ? [r.special] : [])]
  for (const position of positions) {
    for (const a of KEYS) for (const b of KEYS) for (const c of KEYS) {
      const picks = [a, b, c]
      const want = expectedTotals(region, position, picks)
      const characterId = 1 + ((paths * 7) % 52)
      let run = newRun(content, { characterId, region, position })
      for (const k of picks) run = pick(content, run, k)
      for (const silver of [0, Math.floor(want.collected / 2), want.collected]) {
        const code = encodeResult(run, silver)
        const d = decodeResult(code, content, roster)
        t.ok(d.ok, `${code}: did not decode (${d.message})`)
        if (!d.ok) continue
        t.eq([d.characterId, d.region, d.position, d.picks.join(''), d.silver], [characterId, region, position, picks.join(''), silver], `${code}: fields`)
        t.eq([d.marks, d.fama, d.nefas, d.collected], [want.marks, want.fama, want.nefas, want.collected], `${code}: totals`)
        t.eq(d.seq, want.seq, `${code}: scene order`)
      }
      paths++
    }
  }
}
t.eq(paths, 5 * 6 * 64 + 64, 'number of paths (every place, plus the seventh path)')

// The check letter catches every single mistyped character in a sample of codes.
const sample = ['05H2CCA-375', '52B6DDD-0', '01P1ABC-140', '17S3BAD-0', '33G1AAA-50']
let singles = 0, caught = 0
for (const s of sample) {
  const [cc, region, pos, picks, silver] = [s.slice(0, 2), s[2], s[3], s.slice(4, 7), s.split('-')[1]]
  const runLike = { characterId: Number(cc), region, position: Number(pos), picks: picks.split('') }
  const code = encodeResult(runLike, Number(silver))
  const body = code.slice(0, code.lastIndexOf('-'))
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '-') continue
    for (const ch of ALPHABET) {
      if (ch === body[i]) continue
      const typo = body.slice(0, i) + ch + body.slice(i + 1) + code.slice(code.lastIndexOf('-'))
      const d = decodeResult(typo, content, roster)
      singles++
      if (!d.ok) caught++
    }
  }
}
t.eq(caught, singles, `single-character typos caught (${caught} of ${singles})`)

// Neighbouring characters swapped: Luhn mod N misses a few pairs; it must catch at least 95%.
let swaps = 0, swapCaught = 0
for (const s of sample) {
  const code = encodeResult({ characterId: Number(s.slice(0, 2)), region: s[2], position: Number(s[3]), picks: s.slice(4, 7).split('') }, Number(s.split('-')[1]))
  const body = code.slice(0, code.lastIndexOf('-')).replace(/-/g, '')
  for (let i = 0; i < body.length - 1; i++) {
    if (body[i] === body[i + 1]) continue
    const swapped = body.slice(0, i) + body[i + 1] + body[i] + body.slice(i + 2)
    const re = `${swapped.slice(0, 7)}-${swapped.slice(7)}-${code.slice(-1)}`
    swaps++
    if (!decodeResult(re, content, roster).ok) swapCaught++
  }
}
t.ok(swapCaught / swaps >= 0.95, `swapped neighbours caught ${swapCaught} of ${swaps}`)

// Refusals, each with the reason it gives.
const good = encodeResult({ characterId: 5, region: 'H', position: 2, picks: ['C', 'C', 'A'] }, 375)
t.eq(decodeResult(good.toLowerCase().replace('0', 'O'), content, roster).ok, true, 'lower case and O-for-zero are read')
t.eq(decodeResult(' ' + good.split('').join(' ') + ' ', content, roster).ok, true, 'spaces are ignored')
t.eq(decodeResult('01P1ABC-140', content, roster).kind, 'legacy', 'an old v1 code is recognised')
t.eq(decodeResult('12M4BCD', content, roster).kind, 'legacy', 'an old v1 code with region M is recognised')
t.eq(decodeResult(encodeJoin({ characterId: 5, region: 'H', position: 2 }), content, roster).kind, 'join', 'a join code is not a result')
t.eq(decodeResult('hello', content, roster).kind, 'format', 'nonsense is refused')
const tooRich = encodeResult({ characterId: 5, region: 'H', position: 2, picks: ['C', 'C', 'A'] }, 751)
t.eq(decodeResult(tooRich, content, roster).kind, 'silver', 'handing in more than the path collects is refused')
t.eq(decodeResult(encodeResult({ characterId: 53, region: 'P', position: 1, picks: ['A', 'A', 'A'] }, 0), content, roster).kind, 'unknown-character', 'character 53 is refused')
t.eq(decodeResult(encodeResult({ characterId: 5, region: 'P', position: 7, picks: ['A', 'A', 'A'] }, 0), content, roster).kind, 'no-such-slot', 'position 7 outside the Golden Horn is refused')
t.eq(decodeResult(good.slice(0, -1) + (good.endsWith('A') ? 'B' : 'A'), content, roster).kind, 'check', 'a wrong check letter is refused')

// Join codes.
for (let id = 1; id <= 52; id += 3) {
  for (const region of Object.keys(data.regions)) {
    const position = 1 + (id % 6)
    const j = encodeJoin({ characterId: id, region, position })
    const d = decodeJoin(j, content, roster)
    t.eq(d.ok && [d.characterId, d.region, d.position], [id, region, position], `join ${j}`)
    // However the student types it, the code it is saved under is the same.
    for (const typed of [j.replace('-', ''), j.replace('-', ' ').toLowerCase(), ` ${j.toLowerCase()} `]) {
      t.eq(decodeJoin(typed, content, roster).code, j, `join typed as "${typed}"`)
    }
  }
}
t.eq(decodeJoin('05H2-' + (encodeJoin({ characterId: 5, region: 'H', position: 2 }).endsWith('A') ? 'B' : 'A'), content, roster).kind, 'check', 'a join code with a wrong check letter is refused')
t.eq(normalize(' o5h2-k '), '05H2-K', 'normalize')

t.done()
