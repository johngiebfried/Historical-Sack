/**
 * The class tally. A small class is built by hand and every expected number is
 * worked out here from the IM's coding (first shared question V/Pi/Pl/S, second
 * Pi/S/V/Pl) and the values in the content, so the tally code is checked
 * against arithmetic, not against itself.
 */
import { core, readJSON, suite } from './lib/env.mjs'

const t = suite('check-tally')
const { makeContent } = await core('content.js')
const { encodeResult, decodeResult } = await core('codes.js')
const { qualityTally, venice, endgameBlock, band, notableDeeds } = await core('tally.js')
const data = readJSON('src/data/sack.json')
const content = makeContent(data)
const roster = readJSON('src/data/roster.json')
const choice = (id, key) => data.questions.find((q) => q.id === id).choices.find((c) => c.key === key)

// Bands, at their edges.
t.eq([0, 14.9, 15, 29.9, 30, 59.9, 60, 75, 75.1, 200].map(band), [0, 0, 1, 1, 2, 3, 4, 4, 5, 5], 'band edges')

// Four students and one refuser: a class of five.
const students = [
  { characterId: 1, region: 'G', position: 1, picks: ['A', 'C', 'A'], silver: 0 },   // G-Q1 A Violence, G-Q2 C Violence, G-1 A Margaret
  { characterId: 2, region: 'B', position: 2, picks: ['B', 'A', 'B'], silver: 0 },   // B-Q1 B Piety, B-2 A, B-Q3 B Sacrilege (patriarch)
  { characterId: 3, region: 'H', position: 2, picks: ['C', 'C', 'A'], silver: 450 }, // H-Q1 C Plunder, H-Q2 C Violence (Choniates), H-2 A
  { characterId: 4, region: 'P', position: 1, picks: ['D', 'B', 'A'], silver: 0 },   // P-Q1 D Sacrilege, P-Q2 B Sacrilege, P-1 A crown
]
const classSize = 5
const decoded = students.map((s) => decodeResult(encodeResult(s, s.silver), content, roster))
t.ok(decoded.every((d) => d.ok), 'the hand-built class decodes')

// Counts by hand: Violence 3 (s1 x2, s3 x1); Piety 1 (s2); Plunder 1 (s3); Sacrilege 3 (s2 x1, s4 x2).
const q = Object.fromEntries(qualityTally(content, decoded, classSize).map((r) => [r.quality, [r.count, r.pct]]))
t.eq(q, { Violence: [3, 60], Piety: [1, 20], Plunder: [1, 20], Sacrilege: [3, 60] }, 'quality counts and percentages, refuser included')

// Silver: student 3 collects 150 + 150 + 450 = 750 and hands in 450; nobody else collects or hands in more than 0 except as below.
const collected = students.map((s) => {
  const ids = data.regions[s.region].order.map((x) => (x === 'U' ? `${s.region}-${s.position}` : `${s.region}-${x}`))
  return Math.max(0, ids.reduce((sum, id, i) => sum + choice(id, s.picks[i]).marks, 0))
})
const v = venice(decoded, classSize)
t.eq([v.collected, v.turnedIn, v.threshold, v.paid], [collected.reduce((a, b) => a + b, 0), 450, 500, false], 'Venice: 450 handed in against 500 needed')
t.eq(venice(decoded, 4).paid, true, 'Venice: the same silver pays a class of four')

// The endgame block.
const nefasByHand = students.reduce((sum, s) => {
  const ids = data.regions[s.region].order.map((x) => (x === 'U' ? `${s.region}-${s.position}` : `${s.region}-${x}`))
  return sum + ids.reduce((a, id, i) => a + choice(id, s.picks[i]).nefas, 0)
}, 0)
const e = endgameBlock(content, decoded, roster, classSize)
t.eq(e.nefasTotal, nefasByHand, 'nefas total')
t.eq(e.endgameNefas, Math.max(0, nefasByHand), 'endgame nefas')
t.eq(e.empress, [roster[0].name], 'Margaret held by character 1')
t.eq(e.patriarchTaken, [roster[1].name], 'patriarch taken by character 2')
t.eq(e.choniatesHeld, [roster[2].name], 'Choniates held by character 3')
t.eq(e.votes.map((x) => [x.holder, x.votes, x.kind]), [[roster[0].name, 2, 'imperial election'], [roster[3].name, 1, 'imperial election']], 'votes: Margaret +2, the crown of Constantine +1')
t.eq(e.regalia.map((x) => x.item), ['The Crown of Constantine'], 'regalia')

// A merciful class: negative nefas adds nothing to the endgame (IM).
const kind = [{ characterId: 9, region: 'S', position: 1, picks: ['B', 'A', 'D'] }] // S-Q1 B -1, S-Q2 A -1, S-1 D -2
const kd = kind.map((s) => decodeResult(encodeResult(s, 0), content, roster))
const ke = endgameBlock(content, kd, roster, 1)
t.eq([ke.nefasTotal, ke.endgameNefas], [choice('S-Q1', 'B').nefas + choice('S-Q2', 'A').nefas + choice('S-1', 'D').nefas, 0], 'negative nefas floors at 0 for the endgame')

// Notable deeds are anonymous: faction, never the character.
const deeds = notableDeeds(content, decoded, roster)
t.ok(deeds.length > 0 && deeds.every((d) => !('characterId' in d) && !('holder' in d)), 'deeds carry no names')
t.ok(deeds.some((d) => d.sceneId === 'G-1'), 'taking the empress is told')

t.done()
