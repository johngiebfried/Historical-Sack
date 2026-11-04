/**
 * The class's sack, added up for the instructor: the four qualities, the
 * silver and Venice, the deeds worth telling, and the numbers the endgame
 * needs. Takes decoded result codes (codes.js decodeResult, ok results only).
 */
import { QUALITIES } from './content.js'

/*
 * The IM ("Narrating the Sack"): divide the incidents of each answer type by the
 * number of students, refusers included, and describe the result in five
 * groups of 15%, with anything over 75% "legendary". Every sacking student
 * makes two coded choices, so the four percentages can sum to 200%.
 * Boundaries: [0,15) [15,30) [30,45) [45,60) [60,75], then above 75.
 */
export const BANDS = ['scarce', 'occasional', 'common', 'widespread', 'overwhelming', 'legendary']

export function band(pct) {
  if (pct > 75) return 5
  return Math.min(4, Math.floor(pct / 15))
}

function chosen(content, result) {
  return result.seq.map((id, i) => {
    const q = content.question(id)
    return { question: q, choice: q.choices.find((c) => c.key === result.picks[i]) }
  })
}

export function qualityTally(content, results, classSize) {
  const counts = Object.fromEntries(QUALITIES.map((q) => [q, 0]))
  for (const r of results) {
    for (const { question, choice } of chosen(content, r)) {
      if (question.shared && choice.quality) counts[choice.quality] += 1
    }
  }
  return QUALITIES.map((quality) => {
    const pct = classSize ? (counts[quality] / classSize) * 100 : 0
    const b = band(pct)
    return { quality, count: counts[quality], pct, band: b, label: BANDS[b] }
  })
}

/** IM: Venice is repaid in full only if the class hands in at least 100 marks per student. */
export function venice(results, classSize) {
  const collected = results.reduce((s, r) => s + r.collected, 0)
  const turnedIn = results.reduce((s, r) => s + r.silver, 0)
  const threshold = 100 * classSize
  return {
    collected,
    turnedIn,
    kept: collected - turnedIn,
    threshold,
    paid: turnedIn >= threshold,
    shortfall: Math.max(0, threshold - turnedIn),
    share: collected ? turnedIn / collected : 0,
  }
}

const VOTES = /\+(\d+) votes? (in the imperial election|on [^;)]*)/

/** What the Endgame Calculator and the Phase Four committees need. Holders are named here: this is the instructor's sheet. */
export function endgameBlock(content, results, roster, classSize) {
  const name = (id) => roster.find((c) => c.id === id)?.name ?? `Character ${id}`
  const nefasTotal = results.reduce((s, r) => s + r.nefas, 0)
  const items = results.flatMap((r) => r.items.map((it) => ({ ...it, holder: name(r.characterId), characterId: r.characterId })))
  const picked = (qid, key) => results.filter((r) => r.seq.includes(qid) && r.picks[r.seq.indexOf(qid)] === key)
  const votes = items
    .map((it) => {
      const m = it.name.match(VOTES)
      return m ? { holder: it.holder, item: it.name.split(' (')[0], votes: Number(m[1]), kind: m[2].startsWith('in the imperial') ? 'imperial election' : 'committee' } : null
    })
    .filter(Boolean)
  return {
    nefasTotal,
    // IM endgame table: subtract the total nefas, but add nothing if it is negative.
    endgameNefas: Math.max(0, nefasTotal),
    venice: venice(results, classSize),
    empress: items.filter((it) => it.name.startsWith('Empress Margaret')).map((it) => it.holder),
    patriarchTaken: picked('B-Q3', 'B').map((r) => name(r.characterId)),
    choniatesHeld: picked('H-Q2', 'C').map((r) => name(r.characterId)),
    relics: items.filter((it) => it.tags.includes('relic')).map((it) => ({ holder: it.holder, item: it.name.split(' (')[0] })),
    regalia: items.filter((it) => it.tags.includes('regalia')).map((it) => ({ holder: it.holder, item: it.name.split(' (')[0] })),
    claims: items.filter((it) => /Claim|Great House|Warehouse/.test(it.name)).map((it) => ({ holder: it.holder, item: it.name.split(' (')[0] })),
    votes,
  }
}

const NOTABLE = ['named-person', 'relic', 'regalia', 'shared-capture', 'grave', 'merciful', 'prize']

/**
 * Deeds to tell the class, without naming students: the IM allows faction to
 * be given. Ordered so the gravest and the most humane come first.
 */
export function notableDeeds(content, results, roster) {
  const faction = (id) => roster.find((c) => c.id === id)?.faction ?? 'Unknown'
  const rank = (tags) => Math.min(...tags.map((t) => (NOTABLE.includes(t) ? NOTABLE.indexOf(t) : 99)))
  const out = []
  for (const r of results) {
    for (const { question, choice } of chosen(content, r)) {
      if (!choice.tags.some((t) => NOTABLE.includes(t))) continue
      out.push({ faction: faction(r.characterId), sceneId: question.id, scene: question.title, choice: choice.text, outcome: choice.outcome, tags: choice.tags })
    }
  }
  return out.sort((a, b) => rank(a.tags) - rank(b.tags))
}
