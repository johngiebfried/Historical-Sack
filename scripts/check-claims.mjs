/**
 * Claiming follows the IM. Every expected position below is written out by
 * hand from the IM's rules, not computed.
 */
import { core, readJSON, suite } from './lib/env.mjs'

const t = suite('check-claims')
const { newClaiming, claim, refuse } = await core('claims.js')
const { makeContent } = await core('content.js')
const { decodeJoin } = await core('codes.js')
const content = makeContent(readJSON('src/data/sack.json'))
const roster = readJSON('src/data/roster.json')

function run(state, plan) {
  const got = []
  for (const [id, region, opts] of plan) {
    const r = claim(state, id, region, opts)
    got.push(r.ok ? r.assignment.position : r.kind)
    state = r.state
  }
  return { state, got }
}

// Standard, 30 students: each region fills 1..6 in order.
{
  let s = newClaiming({ classSize: 30 })
  const plan = []
  let id = 1
  for (const region of ['P', 'B', 'G', 'S', 'H']) for (let k = 0; k < 6; k++) plan.push([id++, region])
  const { got, state } = run(s, plan)
  t.eq(got, Array.from({ length: 30 }, (_, i) => (i % 6) + 1), 'standard: positions 1..6 in each region')
  t.eq(state.assignments.length, 30, 'standard: thirty assignments')
}

// Standard: a full region refuses until every region is full; then position 6 again, anywhere.
{
  let s = newClaiming({ classSize: 40 })
  let id = 1
  const fill = (region, n) => { for (let k = 0; k < n; k++) s = claim(s, id++, region).state }
  fill('P', 6)
  t.eq(claim(s, 99, 'P').kind, 'region-full', 'standard: a full region is refused while others have room')
  fill('B', 6); fill('G', 6); fill('S', 6); fill('H', 6)
  const extra = []
  for (const region of ['G', 'G', 'P', 'H', 'S', 'B', 'G', 'G', 'P', 'H']) { const r = claim(s, id++, region); extra.push(r.assignment.position); s = r.state }
  t.eq(extra, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6], 'standard: students 31-40 all take position 6')
  t.eq(s.assignments.length, 40, 'standard: forty assignments')
}

// Multiplied, 60 students: capacity 2, so position 1 twice before position 2.
{
  const s = newClaiming({ classSize: 60, mode: 'multiplied' })
  t.eq(s.capacity, 2, 'multiplied 60: capacity 2')
  const { got } = run(s, Array.from({ length: 12 }, (_, i) => [i + 1, 'G']))
  t.eq(got, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6], 'multiplied 60: each place twice, in order')
}
{
  const s = newClaiming({ classSize: 45, mode: 'multiplied' })
  t.eq(s.capacity, 2, 'multiplied 45: capacity rounds up to 2')
  const s90 = newClaiming({ classSize: 90, mode: 'multiplied' })
  t.eq(s90.capacity, 3, 'multiplied 90: capacity 3')
  const s30 = newClaiming({ classSize: 30, mode: 'multiplied' })
  t.eq(s30.capacity, 1, 'multiplied 30: capacity 1')
}

// The seventh path: any number of students, no place used, Golden Horn only.
{
  let s = newClaiming({ classSize: 30 })
  const { got, state } = run(s, [[22, 'H', { simeon: true }], [39, 'H', { simeon: true }], [7, 'H'], [13, 'P', { simeon: true }]])
  t.eq(got, [7, 7, 1, 'no-region'], 'St Simeon: two plotters, then a normal claim still gets position 1')
  t.eq(state.counts.H, [1, 0, 0, 0, 0, 0], 'St Simeon uses no place')
  s = state
}

// One claim per student; refusers cannot claim.
{
  let s = newClaiming({ classSize: 30 })
  s = claim(s, 5, 'P').state
  t.eq(claim(s, 5, 'B').kind, 'already', 'a student cannot claim twice')
  s = refuse(s, 9).state
  t.eq(claim(s, 9, 'B').kind, 'already', 'a refuser cannot claim')
  t.eq(refuse(s, 5).kind, 'already', 'a claimant cannot then refuse')
}

// The join code a claim hands out decodes back to that claim.
{
  const r = claim(newClaiming({ classSize: 30 }), 52, 'S')
  const d = decodeJoin(r.assignment.joinCode, content, roster)
  t.eq([d.ok, d.characterId, d.region, d.position], [true, 52, 'S', 1], 'join code from a claim')
}

t.done()
