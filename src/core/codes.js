/**
 * The codes that carry a sack without a server.
 *
 *   Join code     05H2-K          character 05, Golden Horn, position 2, check letter
 *   Result code   05H2CCA-375-Q   ... choices C, C, A, 375 marks handed in, check letter
 *
 * Old (v1) result codes, from the single-file Sack Module, look like
 * 01P1ABC-140: no check letter, and regions M and R. They are recognised and
 * sent to the old Decoder rather than misread against new scenes.
 */
import { checkChar } from './checkchar.js'
import { newRun, pick, totals } from './run.js'

const RESULT = /^(\d{2})([A-Z])(\d)([A-D]{3})-(\d{1,6})-([0-9A-Z])$/
const JOIN = /^(\d{2})([A-Z])(\d)-?([0-9A-Z])$/ // the dash is optional: students type a space, or nothing
const LEGACY = /^\d{2}[PBGMR][1-6][A-D]{3}(-\d+)?$/

/** Upper-case, drop spaces, and read O as 0 and I as 1: no code contains either letter. */
export function normalize(code) {
  return String(code ?? '').toUpperCase().replace(/\s+/g, '').replace(/O/g, '0').replace(/I/g, '1')
}

const pad = (id) => String(id).padStart(2, '0')

export function encodeJoin({ characterId, region, position }) {
  const payload = `${pad(characterId)}${region}${position}`
  return `${payload}-${checkChar(payload)}`
}

export function encodeResult(run, silver) {
  const payload = `${pad(run.characterId)}${run.region}${run.position}${run.picks.join('')}${silver}`
  return `${pad(run.characterId)}${run.region}${run.position}${run.picks.join('')}-${silver}-${checkChar(payload)}`
}

function fail(kind, message) {
  return { ok: false, kind, message }
}

function slotErrors(content, roster, characterId, region, position) {
  if (!roster.some((c) => c.id === characterId)) return fail('unknown-character', `There is no character ${pad(characterId)} on the roster.`)
  if (!content.validSlot(region, position)) return fail('no-such-slot', `There is no position ${position} in region ${region}.`)
  return null
}

export function decodeJoin(code, content, roster) {
  const c = normalize(code)
  const m = c.match(JOIN)
  if (!m) return fail('format', 'A join code looks like 05H2-K.')
  const [, cc, region, pos, check] = m
  if (checkChar(`${cc}${region}${pos}`) !== check) return fail('check', 'The check letter does not match. Look for a mistyped character.')
  const characterId = Number(cc)
  const position = Number(pos)
  return slotErrors(content, roster, characterId, region, position) ?? { ok: true, code: `${cc}${region}${pos}-${check}`, characterId, region, position }
}

export function decodeResult(code, content, roster) {
  const c = normalize(code)
  const m = c.match(RESULT)
  if (!m) {
    if (LEGACY.test(c)) return fail('legacy', 'This is an old Sack Module code. Use the old Decoder for it.')
    if (JOIN.test(c)) return fail('join', 'This is a join code, not a result code. The student has not finished yet.')
    return fail('format', 'A result code looks like 05H2CCA-375-Q.')
  }
  const [, cc, region, pos, picks, silverText, check] = m
  if (checkChar(`${cc}${region}${pos}${picks}${silverText}`) !== check) {
    return fail('check', 'The check letter does not match. Look for a mistyped character.')
  }
  const characterId = Number(cc)
  const position = Number(pos)
  const silver = Number(silverText)
  const bad = slotErrors(content, roster, characterId, region, position)
  if (bad) return bad

  let run = newRun(content, { characterId, region, position })
  for (const key of picks) run = pick(content, run, key)
  const t = totals(content, run)
  if (silver > t.collected) {
    return fail('silver', `The code hands in ${silver} marks, but that path only collects ${t.collected}.`)
  }
  return { ok: true, code: c, characterId, region, position, picks: run.picks, seq: run.seq, silver, ...t, kept: t.collected - silver }
}
