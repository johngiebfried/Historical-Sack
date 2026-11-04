/**
 * One player's run through a region: three choices, then the confession.
 * Runs are plain objects and every function returns a new one, so the student
 * page can save a run to the browser and resume it after a refresh.
 */

export function newRun(content, { characterId, region, position }) {
  if (!content.validSlot(region, position)) throw new Error(`No position ${position} in region ${region}`)
  return { characterId, region, position, seq: content.sequence(region, position), picks: [] }
}

export function isDone(run) {
  return run.picks.length >= run.seq.length
}

export function currentId(run) {
  return isDone(run) ? null : run.seq[run.picks.length]
}

export function pick(content, run, key) {
  if (isDone(run)) throw new Error('The run is already complete')
  const q = content.question(currentId(run))
  if (!q.choices.some((c) => c.key === key)) throw new Error(`No choice ${key} in ${q.id}`)
  return { ...run, picks: [...run.picks, key] }
}

/** The choices made so far, with their scenes. */
export function choices(content, run) {
  return run.picks.map((key, i) => {
    const q = content.question(run.seq[i])
    return { question: q, choice: q.choices.find((c) => c.key === key) }
  })
}

/**
 * What the run adds up to. Marks can go negative on a single choice (a bribe),
 * but a player cannot hand in less than nothing, so `collected` floors at 0.
 * Nefas is totalled here for the instructor and is never shown to the player.
 */
export function totals(content, run) {
  let marks = 0
  let fama = 0
  let nefas = 0
  const items = []
  for (const { question, choice } of choices(content, run)) {
    marks += choice.marks
    fama += choice.fama
    nefas += choice.nefas ?? 0 // absent from the student page's data, which never shows it
    if (choice.kind && choice.item) items.push({ kind: choice.kind, name: choice.item, tags: choice.tags, from: question.id })
    if (question.card) items.push({ kind: 'card', name: question.card, tags: [], from: question.id })
  }
  return { marks, fama, nefas, collected: Math.max(0, marks), items }
}
