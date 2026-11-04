/**
 * Plays the student page in a real browser: every place in the city, start to
 * sealed code, and checks that what the page shows and the code it hands out
 * agree with the rules.
 *
 *   npm run build && node scripts/check-play.mjs
 *
 * Local only (it needs Chromium and Playwright, which CI does not install).
 * It serves dist/ itself, so build first.
 *
 * What it covers:
 * - all 31 places (5 regions × 6, plus St Simeon) on a phone, reduced motion,
 *   choices and confession chosen at random from a fixed seed;
 * - each shown outcome's marks and fama against the content, and no nefas or
 *   instructor note anywhere on the student page;
 * - the result code decoded with the core: same character, place, picks and
 *   silver, and the totals the page printed;
 * - reloading mid-scene and after sealing, and re-entering the same code;
 * - a bad code, a desktop run with the banner walking, preview mode, and a
 *   run with the keyboard alone;
 * - no console errors and no sideways scrolling, anywhere.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { createRequire } from 'node:module'
import { ROOT, core, readJSON } from './lib/env.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const { makeContent, newRun, pick, totals, encodeJoin, decodeResult } = await core('index.js')

const data = readJSON('src/data/sack.json')
const roster = readJSON('src/data/roster.json')
const content = makeContent(data)
const SHOTS = process.env.SHOTS // a directory to save screenshots in, if wanted

/* A tiny static server for dist/, so the check needs nothing else running. */
const DIST = path.join(ROOT, 'dist')
if (!fs.existsSync(path.join(DIST, 'play.html'))) {
  console.error('check-play: no dist/play.html. Run `npm run build` first.')
  process.exit(1)
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = http.createServer((req, res) => {
  const p = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`

let failures = 0, checks = 0
const ok = (cond, msg) => { checks++; if (!cond) { failures++; console.error('  FAIL ' + msg) } }
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)}, wanted ${JSON.stringify(b)}`)

let seed = 1204
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const any = (xs) => xs[Math.floor(rand() * xs.length)]

const browser = await chromium.launch()
const visited = new Set()

async function open({ viewport, reducedMotion = 'reduce', hash = '' }) {
  const ctx = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`${BASE}/play.html${hash}`)
  return { ctx, page, errors }
}

async function noSideways(page, where) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  ok(over <= 0, `${where}: page scrolls sideways by ${over}px`)
  // Nothing may stick out past the screen's edge either, even where a frame would clip it rather than scroll.
  const out = await page.evaluate(() => [...document.querySelectorAll('.side *, .bar *')]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5) && !e.closest('.sr-only') })
    .slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.className}`))
  eq(out, [], `${where}: elements past the edge of the screen`)
}

const NOT_FOR_STUDENTS = /nefas|source note|GM note|preview only/i

async function shot(page, name) {
  if (!SHOTS) return
  fs.mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SHOTS, name + '.png') })
}

async function join(page, code) {
  await page.getByLabel('Your join code').fill(code)
  await page.getByRole('button', { name: 'Go to my place', exact: true }).click()
}

/** Play the scenes on screen through to the confession, checking each outcome. Returns the picks made. */
async function playScenes(page, slot, { reloadAt = -1, timeout = 3000, label }) {
  const seq = content.sequence(slot.region, slot.position)
  const picks = []
  for (let i = 0; i < seq.length; i++) {
    const q = content.question(seq[i])
    visited.add(q.id)
    const heading = page.locator(`#h-${q.id}`)
    await heading.waitFor({ timeout })
    const leaf = page.locator('article.leaf').first()
    ok(!NOT_FOR_STUDENTS.test(await leaf.innerText()), `${label} ${q.id}: instructor-only words on the leaf before a pick`)
    const key = any(q.choices.map((c) => c.key))
    await page.getByRole('button', { name: new RegExp(`^Choice ${key}:`) }).click()
    picks.push(key)
    const c = q.choices.find((x) => x.key === key)
    await page.locator('.outcome').waitFor()
    eq(await page.locator('.outcome').innerText(), c.outcome.trim(), `${label} ${q.id}${key}: outcome text`)
    const reward = await page.locator('.leaf .reward').first().innerText()
    if (c.marks) ok(reward.includes(`${c.marks > 0 ? '+' : ''}${c.marks} marks`), `${label} ${q.id}${key}: reward "${reward}" lacks ${c.marks} marks`)
    if (c.fama) ok(reward.includes(`${c.fama > 0 ? '+' : ''}${c.fama} fama`), `${label} ${q.id}${key}: reward "${reward}" lacks ${c.fama} fama`)
    if (!c.marks && !c.fama) ok(/No silver/.test(reward), `${label} ${q.id}${key}: no-reward line missing`)
    const text = await leaf.innerText()
    ok(!NOT_FOR_STUDENTS.test(text), `${label} ${q.id}${key}: instructor-only words on the leaf`)
    // The prize cards shown are the ones the rules give for this pick.
    let run = newRun(content, slot)
    for (const k of picks) run = pick(content, run, k)
    const want = totals(content, run).items.filter((it) => it.from === q.id).length
    eq(await page.locator('.leaf .cards .card').count(), want, `${label} ${q.id}${key}: prize cards`)
    await noSideways(page, `${label} ${q.id}`)
    if (i === 0) await shot(page, `${label}-outcome`)
    if (i === reloadAt) {
      await page.reload()
      await page.locator('.outcome').waitFor({ timeout })
      eq(await page.locator('.outcome').innerText(), c.outcome.trim(), `${label} ${q.id}: outcome survives a reload`)
    }
    await page.getByRole('button', { name: i === seq.length - 1 ? 'To the collection' : 'Move on', exact: true }).click()
  }
  return picks
}

async function confessAndRead(page, slot, picks, label) {
  await page.getByRole('heading', { name: 'What do you hand in?' }).waitFor()
  let run = newRun(content, slot)
  for (const k of picks) run = pick(content, run, k)
  const t = totals(content, run)
  const shown = Number(await page.locator('form .tally').nth(1).innerText())
  eq(shown, t.collected, `${label}: marks collected on the confession`)
  // Over the limit is refused, and so is a fraction.
  await page.getByLabel('Marks you hand in').fill(String(t.collected + 10))
  await page.getByRole('button', { name: 'Seal your confession', exact: true }).click()
  ok(/only/.test(await page.locator('#silver-error').innerText()), `${label}: handing in more than collected is refused`)
  const how = any(['none', 'half', 'all', 'some'])
  let silver
  if (how === 'none') { await page.getByRole('button', { name: 'None', exact: true }).click(); silver = 0 }
  else if (how === 'half') { await page.getByRole('button', { name: 'Half', exact: true }).click(); silver = Math.round(t.collected / 2) }
  else if (how === 'all') { await page.getByRole('button', { name: 'All', exact: true }).click(); silver = t.collected }
  else { silver = Math.floor(rand() * (t.collected + 1)); await page.getByLabel('Marks you hand in').fill(String(silver)) }
  await shot(page, `${label}-confess`)
  await page.getByRole('button', { name: 'Seal your confession', exact: true }).click()
  await page.getByRole('heading', { name: 'Your sack is recorded' }).waitFor()
  const code = (await page.locator('.code').innerText()).trim()
  const d = decodeResult(code, content, roster)
  ok(d.ok, `${label}: result code ${code} does not decode (${d.message})`)
  if (d.ok) {
    eq([d.characterId, d.region, d.position], [slot.characterId, slot.region, slot.position], `${label}: code's character and place`)
    eq(d.picks, picks, `${label}: code's picks`)
    eq(d.silver, silver, `${label}: code's silver`)
    eq(d.collected, t.collected, `${label}: code's collected`)
  }
  const reward = await page.locator('.leaf .reward').first().innerText()
  ok(reward.includes(`Collected ${t.collected}`) && reward.includes(`Handed in ${silver}`) && reward.includes(`Kept ${t.collected - silver}`), `${label}: result totals "${reward}"`)
  eq(await page.locator('.leaf .cards .card').count(), t.items.length, `${label}: prize cards on the result`)
  eq(await page.locator('.path li').count(), picks.length, `${label}: path lists every scene`)
  ok(!NOT_FOR_STUDENTS.test(await page.locator('body').innerText()), `${label}: instructor-only words on the result`)
  return { code, silver }
}

/* 1. Every place on a phone, reduced motion. */
const PHONE = { width: 390, height: 844 }
const all = Object.keys(data.regions).flatMap((r) => content.positions(r).map((p) => ({ region: r, position: p })))
eq(all.length, 31, 'places in the city')
// QUICK=1 plays three places (enough to reach both reload tests), for the mutation run.
const places = process.env.QUICK ? all.slice(0, 3) : all
let n = 0
for (const pl of places) {
  const ch = roster[(n * 7) % roster.length]
  const slot = { characterId: ch.id, region: pl.region, position: pl.position }
  const label = `${pl.region}${pl.position}`
  const { ctx, page, errors } = await open({ viewport: PHONE })
  if (n === 0) await shot(page, 'join-phone')
  await join(page, encodeJoin(slot))
  // Every fourth place reloads mid-scene; every fifth reloads after sealing and re-enters the code.
  const picks = await playScenes(page, slot, { reloadAt: n % 4 === 1 ? 0 : -1, label })
  await noSideways(page, label)
  const { code } = await confessAndRead(page, slot, picks, label)
  await noSideways(page, `${label} result`)
  if (n === 0) await shot(page, 'result-phone')
  if (n % 5 === 2) {
    await page.reload()
    eq((await page.locator('.code').innerText()).trim(), code, `${label}: code survives a reload`)
    await page.getByRole('button', { name: 'Use a different code', exact: true }).click()
    await join(page, encodeJoin(slot).toLowerCase().replace('-', ' '))
    eq((await page.locator('.code').innerText()).trim(), code, `${label}: re-entering the join code (lower case, space) brings back the code`)
    await page.getByRole('button', { name: 'Use a different code', exact: true }).click()
    await join(page, encodeJoin(slot).replace('-', ''))
    eq((await page.locator('.code').innerText()).trim(), code, `${label}: the join code without its dash brings back the code`)
  }
  eq(errors, [], `${label}: console errors`)
  await ctx.close()
  n++
}

if (!process.env.QUICK) eq([...visited].sort(), data.questions.map((q) => q.id).sort(), 'every scene played on a phone')

/* 2. A bad code, and a code for a place that does not exist. */
{
  const { ctx, page, errors } = await open({ viewport: PHONE })
  await noSideways(page, 'join')
  await join(page, '05H2-X')
  ok((await page.locator('#join-error').innerText()).length > 0, 'a wrong check letter is refused with a message')
  await join(page, '')
  ok((await page.locator('#join-error').innerText()).length > 0, 'an empty code is refused with a message')
  eq(errors, [], 'bad codes: console errors')
  await ctx.close()
}

/* 3. Desktop, with the banner walking. */
{
  const { ctx, page, errors } = await open({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' })
  const slot = { characterId: 12, region: 'S', position: 1 }
  await join(page, encodeJoin(slot))
  await page.getByText('On the way').waitFor()
  await shot(page, 'travel-desktop')
  const picks = await playScenes(page, slot, { timeout: 8000, label: 'desktop' })
  await noSideways(page, 'desktop')
  await confessAndRead(page, slot, picks, 'desktop')
  await shot(page, 'result-desktop')
  eq(errors, [], 'desktop: console errors')
  await ctx.close()
}

/* 4. Preview: any place, and the instructor's note after a pick. */
{
  const { ctx, page, errors } = await open({ viewport: { width: 1280, height: 800 }, hash: '#preview' })
  await page.getByRole('heading', { name: 'Choose any place' }).waitFor()
  await page.getByRole('button', { name: /The Golden Horn/ }).click()
  await page.getByRole('button', { name: /St Simeon path/ }).click()
  await page.getByRole('button', { name: 'Enter the city', exact: true }).click()
  const q = content.question(content.sequence('H', 7)[0])
  await page.locator(`#h-${q.id}`).waitFor({ timeout: 8000 })
  await page.getByRole('button', { name: /^Choice A:/ }).click()
  await page.getByText('Instructor’s source note (preview only)').waitFor()
  await page.getByText('Read the note').click()
  ok((await page.locator('.gloss details').innerText()).length > 40, 'preview: the source note has text')
  await shot(page, 'preview-note')
  eq(errors, [], 'preview: console errors')
  await ctx.close()
}

/* 5. Keyboard only: focus lands where the next key press needs it, from the join code to the result. */
{
  const { ctx, page, errors } = await open({ viewport: PHONE })
  const slot = { characterId: 10, region: 'B', position: 2 }
  const focused = () => page.evaluate(() => {
    const e = document.activeElement
    return e ? (e.id || e.textContent.trim().slice(0, 40)) : ''
  })
  await page.getByRole('heading', { name: 'Enter the city' }).waitFor()
  await page.keyboard.press('Tab')
  eq(await focused(), 'join', 'keyboard: Tab from the heading reaches the code box')
  await page.keyboard.type(encodeJoin(slot))
  await page.keyboard.press('Enter')
  const seq = content.sequence(slot.region, slot.position)
  const picks = []
  for (const [i, id] of seq.entries()) {
    const q = content.question(id)
    await page.locator(`#h-${q.id}`).waitFor()
    eq(await focused(), `h-${q.id}`, `keyboard: ${q.id} heading has focus on arrival`)
    const at = Math.floor(rand() * q.choices.length)
    for (let k = 0; k <= at; k++) await page.keyboard.press('Tab')
    ok((await focused()).startsWith(q.choices[at].key), `keyboard: ${q.id} Tab reaches choice ${q.choices[at].key}`)
    await page.keyboard.press('Enter')
    picks.push(q.choices[at].key)
    await page.locator('.outcome').waitFor()
    const want = i === seq.length - 1 ? 'To the collection' : 'Move on'
    eq(await focused(), want, `keyboard: ${q.id} focus moves to "${want}" after a choice`)
    await page.keyboard.press('Enter')
  }
  await page.getByRole('heading', { name: 'What do you hand in?' }).waitFor()
  await page.keyboard.press('Tab')
  eq(await focused(), 'silver', 'keyboard: Tab from the heading reaches the silver box')
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('20')
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Your sack is recorded' }).waitFor()
  const d = decodeResult((await page.locator('.code').innerText()).trim(), content, roster)
  eq(d.ok && [d.picks, d.silver], [picks, 20], 'keyboard: the code records the keyed choices and silver')
  eq(errors, [], 'keyboard: console errors')
  await ctx.close()
}

await browser.close()
server.close()
if (failures) {
  console.error(`check-play: ${failures} of ${checks} checks failed`)
  process.exit(1)
}
console.log(`check-play: ${checks} checks passed (${places.length} places and ${visited.size} scenes on a phone; desktop, preview, keyboard)`)
