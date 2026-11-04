/**
 * Simulated classes, shared by check-sim (which asserts on them) and
 * balance-report (which writes them up). Students claim in a shuffled order,
 * choose at random and hand in a fixed share of what they collect.
 */
import { core, readJSON } from './env.mjs'

const { makeContent } = await core('content.js')
const { newRun, pick, totals } = await core('run.js')
const { encodeResult, decodeResult, decodeJoin } = await core('codes.js')
const { newClaiming, claim, refuse } = await core('claims.js')
const { venice, endgameBlock, qualityTally } = await core('tally.js')

export const data = readJSON('src/data/sack.json')
export const roster = readJSON('src/data/roster.json')
export const content = makeContent(data)

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** `note(cond, msg)` receives every internal consistency check, so check-sim can count them. */
export function simulateClass({ classSize, mode = 'standard', turnIn, seed, refusers = 0, plotters = 0, note = () => {} }) {
  const rand = rng(seed)
  // Classes above 52 reuse characters, as very large classes double up roles.
  const ids = Array.from({ length: classSize }, (_, i) => roster[i % roster.length].id)
  let state = newClaiming({ classSize, mode })
  const plays = []
  ids.forEach((characterId, i) => {
    const student = `s${i + 1}`
    if (i < refusers) {
      state = refuse(state, student).state
      return
    }
    let result
    if (i < refusers + plotters) result = claim(state, characterId, 'H', { simeon: true, student })
    else {
      const regions = ['P', 'B', 'G', 'S', 'H'].sort(() => rand() - 0.5)
      for (const region of regions) {
        result = claim(state, characterId, region, { student })
        if (result.ok) break
      }
    }
    note(result.ok, `class ${classSize}: student ${i + 1} could not claim (${result.kind})`)
    state = result.state
    const { region, position, joinCode } = result.assignment
    const j = decodeJoin(joinCode, content, roster)
    note(j.ok && j.characterId === characterId && j.region === region && j.position === position, `class ${classSize}: join code ${joinCode}`)
    let r = newRun(content, { characterId, region, position })
    while (r.picks.length < r.seq.length) r = pick(content, r, 'ABCD'[Math.floor(rand() * 4)])
    const tot = totals(content, r)
    const silver = Math.round(tot.collected * turnIn)
    plays.push({ run: r, silver, tot, code: encodeResult(r, silver) })
  })
  const decoded = plays.map((p) => decodeResult(p.code, content, roster))
  decoded.forEach((d, i) => {
    const p = plays[i]
    note(d.ok && d.picks.join('') === p.run.picks.join('') && d.silver === p.silver && d.nefas === p.tot.nefas, `class ${classSize}: code ${p.code} round trip`)
  })
  const ok = decoded.filter((d) => d.ok)
  return { state, decoded: ok, venice: venice(ok, classSize), endgame: endgameBlock(content, ok, roster, classSize), qualities: qualityTally(content, ok, classSize) }
}

/** The balance figures: many classes per size and turn-in rate. */
export function figures({ sizes = [12, 20, 30, 45, 60], turnIns = [0.25, 0.4, 0.6], classes = 400, note } = {}) {
  const out = []
  for (const classSize of sizes) {
    for (const turnIn of turnIns) {
      let paid = 0, nefas = 0, marks = 0, fama = 0
      for (let k = 0; k < classes; k++) {
        const s = simulateClass({ classSize, turnIn, seed: classSize * 1000 + k + Math.round(turnIn * 100) * 7, note })
        if (s.venice.paid) paid++
        nefas += s.endgame.nefasTotal
        marks += s.venice.collected
        fama += s.decoded.reduce((a, d) => a + d.fama, 0)
      }
      out.push({ classSize, turnIn, paid: paid / classes, nefasPerClass: nefas / classes, nefasPerStudent: nefas / classes / classSize, marksPerStudent: marks / classes / classSize, famaPerStudent: fama / classes / classSize })
    }
  }
  return out
}
