/**
 * content/*.md  ->  src/data/sack.json
 *
 *   node scripts/build-content.mjs           write the data file
 *   node scripts/build-content.mjs --verify  fail if the committed data file is stale
 */
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './lib/env.mjs'
import { parseContent } from './lib/parse-content.mjs'

const { data, problems } = parseContent(path.join(ROOT, 'content'))
if (problems.length) {
  console.error('build-content: the content files could not be read cleanly')
  for (const p of problems) console.error('  - ' + p)
  process.exit(1)
}
/*
 * Two files. sack.json is everything, for the instructor's console and the checks.
 * sack-student.json is what the student page ships: no nefas (the IM: never revealed)
 * and no instructor notes, so neither can be read out of the page's code.
 */
const without = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)))
export const INSTRUCTOR_ONLY = { question: ['source', 'gm', 'file', 'line'], choice: ['nefas'] }
const student = {
  ...data,
  questions: data.questions.map((q) => ({
    ...without(q, INSTRUCTOR_ONLY.question),
    choices: q.choices.map((c) => without(c, INSTRUCTOR_ONLY.choice)),
  })),
}
const outputs = [
  ['sack.json', JSON.stringify(data, null, 1) + '\n'],
  ['sack-student.json', JSON.stringify(student) + '\n'],
]

if (process.argv.includes('--verify')) {
  for (const [name, json] of outputs) {
    const file = path.join(ROOT, 'src', 'data', name)
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (current !== json) {
      console.error(`build-content: src/data/${name} is out of date with content/. Run \`npm run content\`.`)
      process.exit(1)
    }
  }
  console.log(`build-content: data files match content (${data.questions.length} scenes)`)
} else {
  for (const [name, json] of outputs) fs.writeFileSync(path.join(ROOT, 'src', 'data', name), json)
  console.log(`build-content: wrote ${data.questions.length} scenes to src/data/sack.json and sack-student.json`)
}
