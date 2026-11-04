/**
 * Claiming: students choose a region in sack order and take its next open
 * position, as the IM sets out ("Determining Sack Order").
 *
 * standard   Thirty places. Once all thirty are taken, further students may
 *            take position 6 of any region again.
 * multiplied The IM's option for very large classes: every place can be taken
 *            once per thirty students, so in a class of 60 each region's
 *            position 1 is taken twice before anyone gets position 2.
 *
 * The Golden Horn's seventh path (St Simeon) is open to anyone, takes no
 * place, and can be chosen by any number of students.
 *
 * Claims are kept per student. Usually a student is their character, but very
 * large classes double up roles, so a claim may name the student separately
 * (opts.student); the join code still carries the character.
 *
 * State is a plain object; every function returns a new one.
 */
import { REGION_LETTERS } from './content.js'
import { encodeJoin } from './codes.js'

export function newClaiming({ classSize, mode = 'standard' }) {
  const capacity = mode === 'multiplied' ? Math.max(1, Math.ceil(classSize / 30)) : 1
  const counts = Object.fromEntries(REGION_LETTERS.map((r) => [r, [0, 0, 0, 0, 0, 0]]))
  return { classSize, mode, capacity, counts, assignments: [], refused: [] }
}

export function allFull(state) {
  return REGION_LETTERS.every((r) => state.counts[r].every((n) => n >= state.capacity))
}

/** The position a claim on this region would get now, or null if the region is full and others are not. */
export function nextPosition(state, region) {
  const i = state.counts[region].findIndex((n) => n < state.capacity)
  if (i >= 0) return i + 1
  return allFull(state) ? 6 : null
}

function taken(state, student) {
  return state.assignments.some((a) => a.student === student) || state.refused.includes(student)
}

export function claim(state, characterId, region, { simeon = false, student = characterId } = {}) {
  if (taken(state, student)) return { ok: false, kind: 'already', state }
  if (!REGION_LETTERS.includes(region)) return { ok: false, kind: 'no-region', state }
  if (simeon && region !== 'H') return { ok: false, kind: 'no-region', state }

  let position
  let counts = state.counts
  if (simeon) {
    position = 7
  } else {
    position = nextPosition(state, region)
    if (position === null) return { ok: false, kind: 'region-full', state }
    const row = [...counts[region]]
    row[position - 1] += 1
    counts = { ...counts, [region]: row }
  }
  const assignment = { student, characterId, region, position, joinCode: encodeJoin({ characterId, region, position }) }
  return { ok: true, assignment, state: { ...state, counts, assignments: [...state.assignments, assignment] } }
}

export function refuse(state, student) {
  if (taken(state, student)) return { ok: false, kind: 'already', state }
  return { ok: true, state: { ...state, refused: [...state.refused, student] } }
}
