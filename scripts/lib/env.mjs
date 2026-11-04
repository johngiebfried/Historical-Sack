/**
 * Where the checks look. Normally the repository itself; the mutation suite
 * points SACK_ROOT at a broken copy to prove each check can fail.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = process.env.SACK_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export const core = (name) => import(pathToFileURL(path.join(ROOT, 'src', 'core', name)).href)
export const readJSON = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))

/** A tiny assertion counter, so each suite reports how much it proved. */
export function suite(name) {
  let passed = 0
  const failures = []
  return {
    ok(cond, msg) {
      if (cond) passed++
      else failures.push(msg)
    },
    eq(a, b, msg) {
      const ok = JSON.stringify(a) === JSON.stringify(b)
      if (ok) passed++
      else failures.push(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
    },
    done() {
      if (failures.length) {
        console.error(`${name}: ${failures.length} failed, ${passed} passed`)
        for (const f of failures.slice(0, 25)) console.error('  - ' + f)
        if (failures.length > 25) console.error(`  ... and ${failures.length - 25} more`)
        process.exit(1)
      }
      console.log(`${name}: ${passed} checks passed`)
    },
  }
}
