/**
 * Read the region files in content/ and turn them into the game's data.
 *
 * The Markdown is the source of truth: you write it, this reads it. The shape
 * of each scene in the files is:
 *
 *   ## P-Q1 · Title                        (shared Q1/Q2/Q3, or a position 1–7)
 *   *Meta line in italics*
 *   **Prompt.** ...
 *   **A · Violence.** Choice text          (the quality only on shared questions)
 *   > Outcome text
 *   `marks 0 · fama +3 · nefas 0 · prize: Name (effect) · tags: relic, named-person`
 *   ...four choices...
 *   **Student gloss.** ...                 (optional now; required for release)
 *   **Approved.** Name, date               (optional now; required for release)
 *   **Source note.** ...                   (required)
 *
 * Nothing here judges the content; scripts/check-content.mjs does that.
 */
import fs from 'node:fs'
import path from 'node:path'

export const FILES = ['01-petrion.md', '02-blachernae.md', '03-great-palace.md', '04-hagia-sophia.md', '05-golden-horn.md']

export const REGIONS = {
  P: { name: 'Petrion', sub: 'The breach', order: ['Q1', 'Q2', 'U'], positions: 6 },
  B: { name: 'Blachernae', sub: 'Henry’s palace and the land walls', order: ['Q1', 'U', 'Q3'], positions: 6 },
  G: { name: 'The Great Palace', sub: 'Bucoleon and Hippodrome', order: ['Q1', 'Q2', 'U'], positions: 6 },
  S: { name: 'Hagia Sophia', sub: 'The Great Church', order: ['Q1', 'Q2', 'U'], positions: 6 },
  H: { name: 'The Golden Horn', sub: 'Quays, Latin quarters and the Exchange', order: ['Q1', 'Q2', 'U'], positions: 6, special: 7 },
}
const FILE_REGION = { '01': 'P', '02': 'B', '03': 'G', '04': 'S', '05': 'H' }

const HEAD = /^## ([PBGSH])-(Q[123]|[1-7]) · (.+)$/
const CHOICE = /^\*\*([A-D])(?: · (Violence|Piety|Plunder|Sacrilege))?\.\*\* (.+)$/
const EFFECTS = /^`marks (-?\d+) · fama ([+-]?\d+) · nefas ([+-]?\d+)(?: · (prize|bonus): (.+?))?(?: · tags: ([a-z, -]+))?`$/

/** Strip Markdown emphasis for display text. */
export function plain(s) {
  return String(s)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim()
}

/** Tags the build adds from the numbers, so the narration can find deeds before anyone has tagged them by hand. */
export function derivedTags(c) {
  const t = []
  if (c.kind === 'prize') t.push('prize')
  if (c.kind === 'bonus') t.push('shared-capture')
  if (c.nefas >= 3) t.push('grave')
  if (c.nefas <= -1) t.push('merciful')
  if (c.marks >= 400) t.push('high-value')
  return t
}

function collectUntil(lines, from, stop) {
  const out = []
  for (let k = from; k < lines.length; k++) {
    const l = lines[k]
    if (stop(l)) break
    if (l.trim()) out.push(plain(l.replace(/^\s*-\s+/, '')))
  }
  return out
}

export function parseContent(dir) {
  const regions = {}
  const questions = []
  const problems = []

  for (const file of FILES) {
    const letter = FILE_REGION[file.slice(0, 2)]
    const text = fs.readFileSync(path.join(dir, file), 'utf8')
    const lines = text.split('\n')
    const blurb = text.match(/\*\*Region blurb \(student-facing\)\.\*\* (.+)/)
    regions[letter] = { letter, ...REGIONS[letter], blurb: blurb ? plain(blurb[1]) : '' }

    let q = null
    lines.forEach((line, i) => {
      const h = line.match(HEAD)
      if (h) {
        const [, region, slot, rawTitle] = h
        q = {
          id: `${region}-${slot}`,
          region,
          slot,
          shared: slot.startsWith('Q'),
          title: rawTitle.replace(/^Position \d · /, ''),
          meta: '',
          prompt: '',
          choices: [],
          gloss: null,
          approvedBy: null,
          source: '',
          card: null,
          rule: null,
          gm: null,
          file,
          line: i + 1,
        }
        if (region !== letter) problems.push(`${file}:${i + 1}: ${q.id} is in the wrong file`)
        const meta = lines.slice(i + 1, i + 4).find((l) => l.startsWith('*') && !l.startsWith('**'))
        if (meta) q.meta = plain(meta)
        questions.push(q)
        return
      }
      if (!q) return
      if (line.startsWith('**Prompt.**')) q.prompt = plain(line.slice('**Prompt.**'.length))
      else if (line.startsWith('**Student gloss.**')) q.gloss = plain(line.slice('**Student gloss.**'.length))
      else if (line.startsWith('**Approved.**')) q.approvedBy = plain(line.slice('**Approved.**'.length)) || null
      else if (line.startsWith('**Source note.**')) {
        q.source = [plain(line.slice('**Source note.**'.length)), ...collectUntil(lines, i + 1, (l) => l.startsWith('---') || l.startsWith('## '))].join('\n')
      } else if (line.startsWith('**Item card:')) q.card = plain(line)
      else if (line.startsWith('**Rule:')) {
        q.rule = [plain(line), ...collectUntil(lines, i + 1, (l) => l.startsWith('**GM note') || l.startsWith('**Source note') || l.startsWith('---'))].join('\n')
      } else if (line.startsWith('**GM note.**')) q.gm = plain(line.slice('**GM note.**'.length))
      else {
        const c = line.match(CHOICE)
        if (c) {
          q.choices.push({ key: c[1], quality: c[2] ?? null, text: plain(c[3]), outcome: '', marks: null, fama: null, nefas: null, kind: null, item: null, tags: [] })
          return
        }
        const cur = q.choices[q.choices.length - 1]
        if (line.startsWith('> ') && cur) {
          cur.outcome = (cur.outcome + ' ' + plain(line.slice(2))).trim()
          return
        }
        const e = line.match(EFFECTS)
        if (e && cur) {
          cur.marks = Number(e[1])
          cur.fama = Number(e[2])
          cur.nefas = Number(e[3])
          cur.kind = e[4] ?? null
          cur.item = e[5] ? plain(e[5]) : null
          const explicit = e[6] ? e[6].split(',').map((t) => t.trim()).filter(Boolean) : []
          cur.tags = [...new Set([...explicit, ...derivedTags(cur)])]
          return
        }
        if (line.startsWith('`marks') && cur) problems.push(`${file}:${i + 1}: effects line not understood: ${line}`)
      }
    })
  }
  return { data: { version: 1, regions, questions }, problems }
}
