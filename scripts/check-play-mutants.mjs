/**
 * The browser check, proved able to fail. Each mutant breaks the student page
 * in a scratch copy, builds it, and runs check-play (QUICK) against it; the
 * check must fail. An unbroken copy goes first as the control.
 *
 *   node scripts/check-play-mutants.mjs
 *
 * Local only, like check-play. Takes a few minutes.
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

const MUTANTS = [
  ['every pick recorded as A', 'src/play/App.jsx', once('picks: [...record.picks, k]', "picks: [...record.picks, 'A']")],
  ['one mark less handed in than entered', 'src/play/App.jsx', once('update({ ...record, silver })', 'update({ ...record, silver: Math.max(0, silver - 1) })')],
  ['progress not saved', 'src/play/game.js', once("localStorage.setItem(PREFIX + 'run:' + rec.key, JSON.stringify(rec))", '')],
  ['the student page ships nefas', 'src/play/Scene.jsx', once('{signed(choice.marks)}</span> marks of silver</span>)', '{signed(choice.marks)}</span> marks of silver, nefas {choice.nefas}</span>)')],
  ['a prize card not shown', 'src/play/App.jsx', once('.items.filter((it) => it.from === q.id)', '.items.filter((it) => it.from === q.id).slice(1)')],
  ['the leaf too wide for a phone', 'src/play/play.css', once('.choices { display: grid;', '.choices { min-width: 480px; display: grid;')],
  ['preview cannot start', 'src/play/App.jsx', once('const saved = preview ? null : storage.load(slot.key)', 'const saved = !preview && storage.load(slot.key)')],
  ['an error in the console', 'src/play/main.jsx', once("import App from './App.jsx'", "import App from './App.jsx'\nconsole.error('mutant')")],
]

function copyRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sack-play-mutant-'))
  for (const part of ['src', 'scripts', 'content']) fs.cpSync(path.join(ROOT, part), path.join(dir, part), { recursive: true })
  for (const f of ['index.html', 'play.html', 'vite.config.js', 'package.json']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f))
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'))
  return dir
}

function buildAndCheck(dir) {
  const b = spawnSync(process.execPath, [path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--logLevel', 'error'], { cwd: dir, encoding: 'utf8' })
  if (b.status !== 0) return { built: false, status: b.status, out: b.stderr }
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', 'check-play.mjs')], { env: { ...process.env, SACK_ROOT: dir, QUICK: '1' }, encoding: 'utf8', timeout: 300000 })
  return { built: true, status: r.status, out: (r.stderr || r.stdout).trim().split('\n').find((l) => /FAIL|Error|check-play/.test(l)) ?? '' }
}

const control = copyRepo()
const c = buildAndCheck(control)
fs.rmSync(control, { recursive: true, force: true })
if (!c.built || c.status !== 0) {
  console.error(`check-play-mutants: the unbroken control fails (${c.out}); no mutant result can be trusted`)
  process.exit(1)
}

const survivors = []
for (const [name, file, mutate] of MUTANTS) {
  const dir = copyRepo()
  const f = path.join(dir, file)
  fs.writeFileSync(f, mutate(fs.readFileSync(f, 'utf8')))
  const r = buildAndCheck(dir)
  fs.rmSync(dir, { recursive: true, force: true })
  const caught = r.status !== 0
  console.log(`${caught ? 'caught  ' : 'SURVIVED'} ${name}${caught ? `: ${r.out.slice(0, 140)}` : ''}`)
  if (!caught) survivors.push(name)
}
if (survivors.length) {
  console.error(`check-play-mutants: ${survivors.length} of ${MUTANTS.length} mutants survived`)
  process.exit(1)
}
console.log(`check-play-mutants: all ${MUTANTS.length} mutants caught, control passes`)
