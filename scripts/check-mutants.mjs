/**
 * A check that cannot fail proves nothing (siege handoff, §2). Each mutant
 * below breaks one rule in a scratch copy of the repository; at least one of
 * the named checks must then fail. A mutant that survives is reported and
 * fails this suite.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT } from './lib/env.mjs'

const once = (find, replace) => (s) => {
  if (!s.includes(find)) throw new Error(`mutant does not apply: ${find}`)
  return s.replace(find, replace)
}
const inSection = (heading, find, replace) => (s) => {
  const at = s.indexOf(heading)
  if (at < 0) throw new Error(`no section ${heading}`)
  const i = s.indexOf(find, at)
  if (i < 0) throw new Error(`mutant does not apply in ${heading}: ${find}`)
  return s.slice(0, i) + replace + s.slice(i + find.length)
}

const MUTANTS = [
  ['check letter ignores position weighting', 'src/core/checkchar.js', once('factor = factor === 2 ? 1 : 2', 'factor = 1'), ['check-codes']],
  ['check letter is constant', 'src/core/checkchar.js', once('return ALPHABET[(n - (sum % n)) % n]', "return 'A'"), ['check-codes']],
  ['silver over the collected amount accepted', 'src/core/codes.js', once('if (silver > t.collected) {', 'if (false) {'), ['check-codes']],
  ['nefas not added up', 'src/core/run.js', once('nefas += choice.nefas', 'nefas += 0'), ['check-codes']],
  ['collected silver can go negative', 'src/core/run.js', once('collected: Math.max(0, marks)', 'collected: marks'), ['check-codes']],
  ['Blachernae played in the ordinary order', 'src/core/content.js', once("return r.order.map((s) => (s === 'U'", "return ['Q1', 'Q2', 'U'].map((s) => (s === 'U'"), ['check-codes']],
  ['overflow goes to position 5', 'src/core/claims.js', once('return allFull(state) ? 6 : null', 'return allFull(state) ? 5 : null'), ['check-claims']],
  ['large-class capacity rounds down', 'src/core/claims.js', once('Math.ceil(classSize / 30)', 'Math.floor(classSize / 30)'), ['check-claims']],
  ['St Simeon uses a place', 'src/core/claims.js', once('position = 7\n', 'position = 7\n    counts = { ...counts, H: counts.H.map((n, i) => (i === 0 ? n + 1 : n)) }\n'), ['check-claims']],
  ['legendary at exactly 75%', 'src/core/tally.js', once('if (pct > 75) return 5', 'if (pct >= 75) return 5'), ['check-tally']],
  ['percentages over incidents, not students', 'src/core/tally.js', once('(counts[quality] / classSize)', '(counts[quality] / (classSize * 2))'), ['check-tally']],
  ['Venice threshold halved', 'src/core/tally.js', once('const threshold = 100 * classSize', 'const threshold = 50 * classSize'), ['check-tally', 'check-sim']],
  ['negative nefas subtracted in the endgame', 'src/core/tally.js', once('endgameNefas: Math.max(0, nefasTotal)', 'endgameNefas: nefasTotal'), ['check-tally']],
  ['a shared choice coded to the wrong quality', 'content/01-petrion.md', once('**A · Violence.** Draw your knife', '**A · Piety.** Draw your knife'), ['check-content']],
  ['a source note removed', 'content/03-great-palace.md', inSection('## G-4 ', '**Source note.**', '**Notes.**'), ['check-content']],
  ['an exclusive prize at position 6', 'content/03-great-palace.md', inSection('## G-6 ', '`marks 100 · fama 0 · nefas 0`', '`marks 100 · fama 0 · nefas 0 · prize: A Silk Hanging`'), ['check-content']],
  ['shared nefas above +2', 'content/05-golden-horn.md', inSection('## H-Q1 ', 'nefas +2`', 'nefas +3`'), ['check-content']],
  ['a banned phrase in a prompt', 'content/04-hagia-sophia.md', inSection('## S-Q2 ', 'sick Greeks', 'sniveling Greeks'), ['check-content']],
  ['content edited but the data file not rebuilt', 'content/02-blachernae.md', inSection('## B-4 ', 'roast meats', 'roast birds'), ['build-content --verify']],
]

function copyRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sack-mutant-'))
  for (const part of ['content', 'src', 'scripts']) fs.cpSync(path.join(ROOT, part), path.join(dir, part), { recursive: true })
  return dir
}

function runCheck(dir, check) {
  const [name, ...args] = check.split(' ')
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', `${name}.mjs`), ...args], { env: { ...process.env, SACK_ROOT: dir }, encoding: 'utf8' })
  return r.status
}

// Control: an unbroken copy must pass every check used below, or a "caught" mutant
// might only mean the scratch copy cannot run at all.
{
  const dir = copyRepo()
  const all = [...new Set(MUTANTS.flatMap((m) => m[3]))]
  const broken = all.filter((c) => runCheck(dir, c) !== 0)
  fs.rmSync(dir, { recursive: true, force: true })
  if (broken.length) {
    console.error(`check-mutants: the unmutated copy fails ${broken.join(', ')}, so no mutant result can be trusted`)
    process.exit(1)
  }
}

let killed = 0
const survivors = []
for (const [label, file, mutate, checks] of MUTANTS) {
  const dir = copyRepo()
  const p = path.join(dir, file)
  fs.writeFileSync(p, mutate(fs.readFileSync(p, 'utf8')))
  const failed = checks.some((c) => runCheck(dir, c) !== 0)
  if (failed) killed++
  else survivors.push(`${label} (${checks.join(', ')} still passed)`)
  fs.rmSync(dir, { recursive: true, force: true })
}

// The release gate must refuse today's content, which has no glosses or approvals yet.
const gateDir = copyRepo()
const gateHolds = runCheck(gateDir, 'check-content --release') !== 0
fs.rmSync(gateDir, { recursive: true, force: true })

if (survivors.length || !gateHolds) {
  console.error(`check-mutants: ${survivors.length} of ${MUTANTS.length} mutants survived`)
  for (const s of survivors) console.error('  - ' + s)
  if (!gateHolds) console.error('  - the release gate passed content with no glosses or approvals')
  process.exit(1)
}
console.log(`check-mutants: all ${killed} mutants caught; release gate holds`)
