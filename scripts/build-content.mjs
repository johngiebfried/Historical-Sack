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
const out = path.join(ROOT, 'src', 'data', 'sack.json')
const json = JSON.stringify(data, null, 1) + '\n'

if (process.argv.includes('--verify')) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''
  if (current !== json) {
    console.error('build-content: src/data/sack.json is out of date with content/. Run `npm run content`.')
    process.exit(1)
  }
  console.log(`build-content: data file matches content (${data.questions.length} scenes)`)
} else {
  fs.writeFileSync(out, json)
  console.log(`build-content: wrote ${data.questions.length} scenes to src/data/sack.json`)
}
