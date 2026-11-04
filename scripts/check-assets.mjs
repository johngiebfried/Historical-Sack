/**
 * The map and the font keep up with the content.
 *
 * - Every scene has a stop on the map, with a label and a drawing it knows.
 * - Every stop stands inside the city walls (the placeholder map only; a
 *   pinned instructor map is checked against its own bounds instead).
 * - Every character in the content is one the bundled font was cut to draw,
 *   so no name ever falls back to a different face mid-line.
 */
import { core, readJSON, suite } from './lib/env.mjs'
import { inFont } from './lib/font-ranges.mjs'

const t = suite('check-assets')
const data = readJSON('src/data/sack.json')
const map = readJSON('src/data/map.json')
const { KINDS } = await core('../play/draw/vignettes.js')

function inside(poly, x, z) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}

for (const q of data.questions) {
  const s = map.stops[q.id]
  t.ok(Boolean(s), `${q.id}: no stop on the map`)
  if (!s) continue
  t.ok(typeof s.label === 'string' && s.label.length > 0, `${q.id}: stop has no label`)
  t.ok(KINDS.includes(s.kind), `${q.id}: no drawing called "${s.kind}"`)
  if (map.placeholder) t.ok(inside(map.geo.peninsula, s.x, s.z), `${q.id}: stop (${s.x}, ${s.z}) is outside the walls`)
}
t.eq(Object.keys(map.stops).sort(), data.questions.map((q) => q.id).sort(), 'map stops and scenes match one for one')
for (const r of Object.keys(data.regions)) t.ok(Boolean(map.regions[r]), `region ${r} has no shape on the map`)

const seen = new Set()
const walk = (o) => {
  if (typeof o === 'string') for (const ch of o) seen.add(ch)
  else if (o && typeof o === 'object') Object.values(o).forEach(walk)
}
walk(data)
walk(map.stops)
walk(map.places)
const missing = [...seen].filter((ch) => !inFont(ch))
t.eq(missing.map((ch) => `U+${ch.codePointAt(0).toString(16)}`), [], 'characters the bundled font cannot draw')

// The student page's data is the full data less what only the instructor sees: no nefas, no notes.
const student = readJSON('src/data/sack-student.json')
const leaks = []
const hunt = (o, path) => {
  if (Array.isArray(o)) o.forEach((v, i) => hunt(v, `${path}[${i}]`))
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    if (['nefas', 'source', 'gm'].includes(k)) leaks.push(`${path}.${k}`)
    hunt(v, `${path}.${k}`)
  }
}
hunt(student, 'student')
t.eq(leaks, [], 'instructor-only fields in the student data')
t.eq(student.questions.map((q) => q.id), data.questions.map((q) => q.id), 'student data has every scene, in order')
for (const [i, q] of student.questions.entries()) {
  const full = data.questions[i]
  t.eq(q.choices.map((c) => [c.key, c.marks, c.fama, c.text]), full.choices.map((c) => [c.key, c.marks, c.fama, c.text]), `${q.id}: student choices match`)
}

t.done()
