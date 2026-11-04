/**
 * Is the content fit to play?
 *
 *   node scripts/check-content.mjs            draft rules
 *   node scripts/check-content.mjs --release  also requires a student gloss and an approval on every scene
 *
 * Reads content/*.md directly (not the built JSON), so it judges what you wrote.
 */
import path from 'node:path'
import { ROOT, readJSON, suite } from './lib/env.mjs'
import { parseContent, REGIONS } from './lib/parse-content.mjs'

const release = process.argv.includes('--release')
const t = suite(release ? 'check-content (release)' : 'check-content')
const { data, problems } = parseContent(path.join(ROOT, 'content'))
for (const p of problems) t.ok(false, p)

const PATTERN = {
  first: ['Violence', 'Piety', 'Plunder', 'Sacrilege'],
  second: ['Piety', 'Sacrilege', 'Violence', 'Plunder'],
}
const TAGS = new Set(['relic', 'regalia', 'named-person', 'counterfactual', 'harsh', 'merciful', 'high-value', 'prize', 'shared-capture', 'grave'])
const BANNED = ['sniveling', 'despicable', 'lousy', 'demon-prophet', 'infidel', 'dastardly', 'filthy business', 'woman of the night']
// A run of words inside double quotes in player-facing text looks like a quotation; the app carries none.
const QUOTED = /["“][^"”]{25,}["”]/

const byId = new Map(data.questions.map((q) => [q.id, q]))
for (const q of data.questions) {
  const at = `${q.id} (${q.file}:${q.line})`
  t.ok(q.prompt.length > 0, `${at}: no prompt`)
  t.ok(q.source.length > 0, `${at}: no source note`)
  t.eq(q.choices.map((c) => c.key), ['A', 'B', 'C', 'D'], `${at}: choices`)

  const regionOrder = REGIONS[q.region].order
  const sharedIndex = regionOrder.filter((s) => s !== 'U').indexOf(q.slot)
  if (q.shared) {
    const want = sharedIndex === 0 ? PATTERN.first : PATTERN.second
    t.eq(q.choices.map((c) => c.quality), want, `${at}: quality coding`)
  } else {
    t.ok(q.choices.every((c) => c.quality === null), `${at}: a unique scene carries quality codes`)
  }

  for (const c of q.choices) {
    const ca = `${at} ${c.key}`
    t.ok(c.outcome.length > 0, `${ca}: no outcome`)
    t.ok(c.marks !== null, `${ca}: no effects line`)
    if (c.marks === null) continue
    t.ok(c.fama >= -3 && c.fama <= 4, `${ca}: fama ${c.fama} outside -3..+4`)
    if (q.shared) {
      t.ok(c.marks >= 0 && c.marks <= 200, `${ca}: shared marks ${c.marks} outside 0..200`)
      t.ok(c.kind !== 'prize', `${ca}: an exclusive prize in a shared scene`)
      t.ok(c.nefas >= -1 && c.nefas <= 2, `${ca}: shared nefas ${c.nefas} outside -1..+2`)
    } else {
      t.ok(c.marks >= -100 && c.marks <= 750, `${ca}: marks ${c.marks} outside -100..750`)
      t.ok(c.nefas >= -3 && c.nefas <= 4, `${ca}: nefas ${c.nefas} outside -3..+4`)
      if (q.slot === '6') t.ok(c.kind !== 'prize', `${ca}: an exclusive prize at position 6, which two players can share`)
    }
    for (const tag of c.tags) t.ok(TAGS.has(tag), `${ca}: unknown tag "${tag}"`)
    const facing = `${q.prompt} ${c.text} ${c.outcome} ${q.gloss ?? ''}`
    for (const w of BANNED) t.ok(!facing.toLowerCase().includes(w), `${ca}: banned phrase "${w}"`)
    t.ok(!QUOTED.test(facing), `${ca}: player-facing text contains what looks like a quotation`)
  }
  if (release) {
    t.ok(Boolean(q.gloss), `${at}: no student gloss`)
    t.ok(Boolean(q.approvedBy), `${at}: not approved`)
  }
}

// Structure: each region has its shared scenes in its own order and positions 1-6; the Golden Horn also has 7.
for (const [letter, r] of Object.entries(REGIONS)) {
  for (const s of r.order.filter((x) => x !== 'U')) t.ok(byId.has(`${letter}-${s}`), `${letter}: missing shared scene ${s}`)
  for (let p = 1; p <= r.positions; p++) t.ok(byId.has(`${letter}-${p}`), `${letter}: missing position ${p}`)
  if (r.special) t.ok(byId.has(`${letter}-${r.special}`), `${letter}: missing special path ${r.special}`)
  const extra = data.questions.filter((q) => q.region === letter && !q.shared && Number(q.slot) > r.positions && Number(q.slot) !== r.special)
  t.ok(extra.length === 0, `${letter}: unexpected positions ${extra.map((q) => q.id)}`)
}
t.eq(data.questions.length, 41, 'scene count (5 regions x 8, plus St Simeon)')

// The roster the codes refer to: the siege's 52 characters.
const roster = readJSON('src/data/roster.json')
t.eq(roster.map((c) => c.id), Array.from({ length: 52 }, (_, i) => i + 1), 'roster ids 1..52 in order')
const FACTIONS = new Set(['Imperial', 'Venetian', 'N. French', 'Clerical', 'Indeterminate'])
t.ok(roster.every((c) => FACTIONS.has(c.faction)), 'roster factions')

t.done()
