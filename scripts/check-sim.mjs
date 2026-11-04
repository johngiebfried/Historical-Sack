/**
 * Whole sacks, start to finish: claim in sack order, play, confess, encode,
 * decode, tally. This is the check the siege handoff asked for first, because
 * faults between the parts only show when the parts run together.
 */
import { suite } from './lib/env.mjs'
import { simulateClass, figures } from './lib/simulate.mjs'

const t = suite('check-sim')
const note = (cond, msg) => t.ok(cond, msg)

// Overflow: in a standard class of 45, fifteen students take position 6 a second time.
{
  const { state } = simulateClass({ classSize: 45, turnIn: 0.5, seed: 3, note })
  t.eq(state.assignments.filter((a) => a.position === 6).length, 5 + 15, 'class of 45: five first sixes plus fifteen overflow')
}
// Multiplied, 60: every place taken exactly twice.
{
  const { state } = simulateClass({ classSize: 60, mode: 'multiplied', turnIn: 0.5, seed: 4, note })
  t.ok(Object.values(state.counts).every((row) => row.every((n) => n === 2)), 'class of 60, multiplied: every place twice')
}
// Refusers count in the class; plotters take the seventh path without using a place.
{
  const { state, venice } = simulateClass({ classSize: 30, turnIn: 0.5, seed: 5, refusers: 2, plotters: 3, note })
  t.eq(state.refused.length, 2, 'two refusers recorded')
  t.eq(state.assignments.filter((a) => a.position === 7).length, 3, 'three St Simeon plotters')
  t.eq(venice.threshold, 3000, 'Venice threshold counts refusers')
  t.eq(Object.values(state.counts).flat().reduce((a, b) => a + b, 0), 25, 'twenty-five places used by the other students')
}

// Venice is reachable but not automatic.
for (const f of figures({ classes: 300, note })) {
  if (f.turnIn === 0.25 && f.classSize >= 20) t.ok(f.paid < 0.3, `class ${f.classSize}: handing in a quarter paid Venice ${Math.round(f.paid * 100)}% of the time`)
  if (f.turnIn === 0.4) t.ok(f.paid > 0.75, `class ${f.classSize}: handing in two fifths paid Venice only ${Math.round(f.paid * 100)}% of the time`)
  if (f.turnIn === 0.6) t.ok(f.paid > 0.97, `class ${f.classSize}: handing in three fifths paid Venice only ${Math.round(f.paid * 100)}% of the time`)
}

t.done()
