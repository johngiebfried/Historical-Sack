/**
 * The student page's game state, and how it is saved.
 *
 * A player's progress is one small record:
 *   { key, characterId, region, position, picks, ack, silver }
 * `picks` are the choices made; `ack` counts outcomes the player has read and
 * moved on from; `silver` is set once they confess. Everything else (the
 * scenes, the totals, the code) is derived from it with the core rules, so
 * the saved record can never disagree with the game.
 */
import sack from '../data/sack-student.json'
import roster from '../data/roster.json'
import map from '../data/map.json'
import { makeContent, newRun, pick, totals, encodeResult } from '../core/index.js'

export const content = makeContent(sack)
export { roster, map }
export const isDraft = sack.questions.some((q) => !q.approvedBy)

/** The instructor's source notes: not in the student page's data, fetched only in preview. */
let notes = null
export function loadNotes() {
  notes ??= import('../data/sack.json').then((m) => Object.fromEntries(m.default.questions.map((q) => [q.id, q.source])))
  return notes
}
export const regionNames = Object.fromEntries(Object.entries(sack.regions).map(([k, r]) => [k, r.name]))

export function newRecord({ key, characterId, region, position }) {
  return { key, characterId, region, position, picks: [], ack: 0, silver: null }
}

export function runOf(rec) {
  let run = newRun(content, rec)
  for (const k of rec.picks) run = pick(content, run, k)
  return run
}

/** Which screen the record calls for. */
export function stageOf(rec) {
  if (!rec) return 'start'
  if (rec.silver !== null) return 'done'
  if (rec.picks.length > rec.ack) return 'outcome'
  if (rec.ack >= content.sequence(rec.region, rec.position).length) return 'confess'
  return 'scene'
}

export const totalsOf = (rec) => totals(content, runOf(rec))
export const codeOf = (rec) => encodeResult(runOf(rec), rec.silver)
export const character = (id) => roster.find((c) => c.id === id)

/** Split an item's text into a name and its effect, as the cards show them. */
export function cardText(item) {
  if (item.kind === 'card') {
    const body = item.name.replace(/^Item card:\s*/, '')
    const title = body.split('.')[0]
    const reads = (body.split('It reads:')[1] || '').trim()
    return { kind: 'Item card', name: title, effect: reads }
  }
  const at = item.name.indexOf(' (')
  const name = at > 0 ? item.name.slice(0, at) : item.name
  const effect = at > 0 ? item.name.slice(at + 2, -1) : ''
  return { kind: item.kind === 'bonus' ? 'Shared with all who chose this' : 'Prize', name, effect }
}

/* Saving. Browser storage can be missing or refuse (private windows, blocked site data), so every call is guarded and the game works without it. */
const PREFIX = 'historical-sack:'
export const storage = {
  save(rec) {
    try {
      localStorage.setItem(PREFIX + 'run:' + rec.key, JSON.stringify(rec))
      localStorage.setItem(PREFIX + 'last', rec.key)
    } catch { /* playing on without saving */ }
  },
  load(key) {
    try {
      const raw = localStorage.getItem(PREFIX + 'run:' + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  last() {
    try {
      return localStorage.getItem(PREFIX + 'last')
    } catch {
      return null
    }
  },
  forget(key) {
    try {
      localStorage.removeItem(PREFIX + 'run:' + key)
      if (localStorage.getItem(PREFIX + 'last') === key) localStorage.removeItem(PREFIX + 'last')
    } catch { /* nothing to forget */ }
  },
}
