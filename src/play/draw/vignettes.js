/*
 * Marginal drawings and illuminated capitals, drawn in ink at runtime: no
 * fetched images. Places, objects and aftermath only; nothing here depicts
 * harm to a person.
 *
 * Each drawing fills a 200 x 150 box. The line has a slight seeded tremor, so a
 * drawing is the same every time it is shown.
 */
const INK = '#2b2118', RUB = '#a32b25', LAP = '#2f4d8a', GOLD = '#c9a227', STONE = '#d8cdb4', WATER = '#5f8290'

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pen(ctx, rand) {
  const j = (v) => v + (rand() - 0.5) * 1.6
  return {
    line(pts, { w = 1.6, color = INK, close = false, fill = null } = {}) {
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(j(x), j(y)) : ctx.moveTo(j(x), j(y))))
      if (close) ctx.closePath()
      if (fill) { ctx.fillStyle = fill; ctx.fill() }
      ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()
    },
    rect(x, y, w, h, o = {}) { this.line([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true }) },
    arc(cx, cy, r, a0, a1, { w = 1.6, color = INK, fill = null } = {}) {
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1)
      if (fill) { ctx.fillStyle = fill; ctx.fill() }
      ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke()
    },
    wash(pts, color, alpha = 0.35) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath()
      ctx.fillStyle = color; ctx.fill(); ctx.restore()
    },
    ground(y = 128) { this.line([[8, y], [192, y]], { w: 1.2 }); for (let x = 14; x < 190; x += 11) this.line([[x, y + 3], [x + 5, y + 3]], { w: 0.8 }) },
  }
}

function dome(p, cx, base, r, wash = STONE) {
  p.wash([[cx - r, base], ...Array.from({ length: 13 }, (_, i) => [cx - r * Math.cos((i / 12) * Math.PI), base - r * Math.sin((i / 12) * Math.PI)]), [cx + r, base]], wash, 0.6)
  p.arc(cx, base, r, Math.PI, 0)
  p.line([[cx, base - r], [cx, base - r - 9]]); p.line([[cx - 4, base - r - 6], [cx + 4, base - r - 6]])
}
function tower(p, x, y, w, h) {
  p.wash([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], STONE, 0.7)
  p.rect(x, y, w, h)
  for (let i = 0; i < w; i += 6) p.rect(x + i, y - 5, 4, 5, { w: 1.2 })
  p.line([[x, y + h * 0.45], [x + w, y + h * 0.45]], { color: RUB, w: 1.2 })
}

const DRAW = {
  gate(p) {
    p.ground(); tower(p, 26, 40, 34, 88); tower(p, 140, 40, 34, 88)
    p.wash([[60, 128], [60, 62], [140, 62], [140, 128]], STONE, 0.6); p.rect(60, 62, 80, 66)
    p.arc(100, 104, 18, Math.PI, 0); p.line([[82, 104], [82, 128]]); p.line([[118, 104], [118, 128]])
    p.wash([[83, 128], [83, 104], [117, 104], [117, 128]], INK, 0.5)
    p.rect(92, 70, 16, 20, { fill: GOLD })
  },
  tents(p) {
    p.ground()
    for (const [x, top, half] of [[40, 70, 34], [100, 52, 46], [160, 76, 30]]) {
      p.line([[x - half, 128], [x, top], [x + half, 128]], { close: true, fill: 'rgba(163,43,37,0.55)' })
      p.line([[x, top], [x, top - 14]]); p.line([[x, top - 14], [x + 12, top - 10], [x, top - 6]], { fill: GOLD })
      p.line([[x - 6, 128], [x, 104], [x + 6, 128]])
    }
  },
  tomb(p) {
    p.ground(); p.wash([[34, 124], [34, 82], [166, 82], [166, 124]], '#7d3b4a', 0.45)
    p.rect(34, 82, 132, 42); p.line([[28, 82], [100, 58], [172, 82]], { close: true, fill: 'rgba(125,59,74,0.35)' })
    p.line([[100, 66], [100, 78]], { color: GOLD, w: 2.4 }); p.line([[94, 71], [106, 71]], { color: GOLD, w: 2.4 })
    for (let x = 44; x < 160; x += 22) p.rect(x, 92, 14, 22, { w: 1 })
  },
  chest(p) {
    p.ground(); p.wash([[46, 126], [46, 78], [154, 78], [154, 126]], '#7a5636', 0.55)
    p.rect(46, 78, 108, 48); p.line([[46, 78], [52, 60], [148, 60], [154, 78]])
    for (const x of [62, 100, 138]) p.line([[x, 62], [x, 126]], { color: INK, w: 2.4 })
    p.rect(94, 88, 12, 14, { fill: GOLD })
  },
  church(p) {
    p.ground(); p.wash([[40, 128], [40, 74], [160, 74], [160, 128]], STONE, 0.65); p.rect(40, 74, 120, 54)
    dome(p, 100, 74, 30, '#a8b0ad'); dome(p, 56, 74, 14); dome(p, 144, 74, 14)
    p.arc(100, 112, 10, Math.PI, 0); p.line([[90, 112], [90, 128]]); p.line([[110, 112], [110, 128]])
  },
  cistern(p) {
    p.wash([[10, 140], [10, 96], [190, 96], [190, 140]], WATER, 0.55)
    for (let x = 22; x < 190; x += 34) { p.rect(x, 30, 12, 96, { fill: 'rgba(216,205,180,0.8)' }); p.arc(x + 23, 34, 17, Math.PI, 0) }
    for (let x = 14; x < 190; x += 18) p.line([[x, 112], [x + 9, 112]], { w: 0.8, color: '#1e3b45' })
  },
  palace(p) {
    p.ground(); p.wash([[22, 128], [22, 62], [178, 62], [178, 128]], STONE, 0.6); p.rect(22, 62, 156, 66)
    for (let x = 32; x < 172; x += 20) { p.arc(x + 6, 84, 6, Math.PI, 0); p.line([[x, 84], [x, 98]]); p.line([[x + 12, 84], [x + 12, 98]]) }
    p.line([[16, 62], [100, 40], [184, 62]], { fill: 'rgba(180,100,63,0.55)', close: true })
    p.line([[100, 40], [100, 24]]); p.line([[100, 24], [114, 28], [100, 33]], { fill: '#5b2d5b' })
  },
  crown(p) {
    const pts = [[50, 112], [50, 66], [72, 86], [100, 50], [128, 86], [150, 66], [150, 112]]
    p.wash(pts, GOLD, 0.7); p.line(pts, { close: true, w: 2 }); p.line([[50, 100], [150, 100]])
    for (const [x, y, c] of [[70, 106, RUB], [100, 106, LAP], [130, 106, RUB]]) p.arc(x, y, 4, 0, Math.PI * 2, { fill: c })
    p.arc(100, 50, 5, 0, Math.PI * 2, { fill: RUB })
  },
  tower(p) { p.ground(); tower(p, 72, 30, 56, 98); p.line([[20, 128], [72, 96]]); p.line([[128, 96], [190, 128]]); p.line([[100, 30], [100, 10]]); p.line([[100, 10], [118, 15], [100, 20]], { fill: RUB }) },
  table(p) {
    p.line([[20, 90], [180, 90], [170, 104], [30, 104]], { close: true, fill: 'rgba(122,86,54,0.5)' })
    p.line([[36, 104], [36, 132]]); p.line([[164, 104], [164, 132]])
    for (const x of [50, 86, 122, 154]) p.line([[x - 6, 72], [x + 6, 72], [x + 3, 88], [x - 3, 88]], { close: true, fill: GOLD })
    p.arc(104, 84, 9, Math.PI, 0, { fill: '#9d6a4c' })
  },
  road(p) {
    p.wash([[70, 140], [96, 40], [104, 40], [130, 140]], '#bfa978', 0.5)
    p.line([[70, 140], [96, 40]]); p.line([[130, 140], [104, 40]])
    tower(p, 120, 28, 26, 40); tower(p, 54, 28, 26, 40)
    for (let i = 0; i < 6; i++) { const y = 130 - i * 15, x = 100 + (i % 2 ? 6 : -6) * (1 - i / 7); p.line([[x, y], [x, y - 9]], { w: 2.2 }); p.arc(x, y - 12, 2.4, 0, Math.PI * 2, { fill: INK }) }
  },
  horse(p) {
    p.ground()
    p.line([[52, 92], [70, 80], [126, 80], [140, 66], [150, 70], [146, 82], [138, 94], [132, 100], [64, 100]], { close: true, fill: 'rgba(122,86,54,0.55)' })
    for (const [x, y] of [[66, 100], [80, 100], [116, 100], [130, 100]]) p.line([[x, y], [x + (x % 2 ? 2 : -2), 128]])
    p.line([[52, 92], [40, 108]]); p.line([[96, 80], [96, 100]], { color: RUB, w: 3 })
  },
  axe(p) {
    p.ground()
    for (const [x, d] of [[60, 1], [100, -1], [140, 1]]) {
      p.line([[x, 128], [x, 34]], { w: 2.4 })
      p.line([[x, 38], [x + 22 * d, 30], [x + 26 * d, 50], [x, 54]], { close: true, fill: 'rgba(214,214,208,0.9)' })
    }
  },
  hippodrome(p) {
    p.wash([[20, 112], [20, 52], [180, 52], [180, 112]], '#c9b98f', 0.5)
    p.line([[20, 112], [20, 52], [150, 52]]); p.arc(150, 82, 30, -Math.PI / 2, Math.PI / 2); p.line([[150, 112], [20, 112]])
    p.line([[40, 82], [150, 82]], { w: 3 })
    for (const [x, y] of [[56, 70], [88, 66], [120, 70]]) { p.line([[x, 82], [x, y]], { w: 2 }); p.arc(x, y - 3, 3, 0, Math.PI * 2, { fill: GOLD }) }
    p.line([[136, 82], [136, 58]], { w: 2.6 })
  },
  relic(p) {
    p.line([[60, 120], [60, 60], [100, 36], [140, 60], [140, 120]], { close: true, fill: 'rgba(201,162,39,0.6)' })
    p.line([[100, 52], [100, 104]], { color: RUB, w: 3 }); p.line([[84, 68], [116, 68]], { color: RUB, w: 3 })
    for (const [x, y] of [[72, 110], [128, 110], [72, 70], [128, 70]]) p.arc(x, y, 3.5, 0, Math.PI * 2, { fill: LAP })
    for (let i = 0; i < 9; i++) p.line([[100 + Math.cos(i) * 52, 78 + Math.sin(i) * 52], [100 + Math.cos(i) * 60, 78 + Math.sin(i) * 60]], { color: GOLD, w: 1.4 })
  },
  boat(p) {
    p.wash([[10, 140], [10, 104], [190, 104], [190, 140]], WATER, 0.5)
    p.line([[48, 104], [152, 104], [138, 122], [62, 122]], { close: true, fill: 'rgba(125,90,60,0.75)' })
    p.line([[100, 104], [100, 40]]); p.line([[100, 44], [140, 98], [100, 98]], { close: true, fill: 'rgba(227,217,196,0.9)' })
    for (let x = 20; x < 190; x += 22) p.line([[x, 132], [x + 10, 130], [x + 18, 132]], { w: 0.8, color: '#1e3b45' })
  },
  dome(p) { p.ground(); p.wash([[30, 128], [30, 80], [170, 80], [170, 128]], STONE, 0.6); p.rect(30, 80, 140, 48); dome(p, 100, 80, 46, '#a8b0ad'); for (let x = 62; x <= 138; x += 12) p.line([[x, 80], [x, 72]]); p.rect(84, 98, 32, 30, { fill: 'rgba(201,162,39,0.6)' }) },
  column(p) { p.ground(); [44, 100, 156].forEach((x, i) => { p.wash([[x - 9, 128], [x - 9, 40], [x + 9, 40], [x + 9, 128]], i === 1 ? '#7d3b4a' : '#8d8f78', 0.55); p.rect(x - 9, 40, 18, 88); p.rect(x - 13, 32, 26, 8) }) },
  altar(p) {
    p.ground(); p.line([[40, 128], [40, 60], [100, 30], [160, 60], [160, 128]], { w: 1.2 })
    p.rect(60, 96, 80, 32, { fill: 'rgba(201,162,39,0.7)' }); p.line([[56, 96], [144, 96]], { w: 2.4 })
    for (const x of [64, 136]) p.line([[x, 96], [x, 60]], { w: 2.2, color: '#9aa0a6' })
    p.line([[60, 60], [100, 42], [140, 60]], { w: 2, color: '#9aa0a6' })
  },
  house(p) {
    p.ground()
    for (const [x, top, w] of [[24, 70, 58], [86, 56, 62], [150, 78, 40]]) {
      p.wash([[x, 128], [x, top], [x + w, top], [x + w, 128]], '#ded2ba', 0.75); p.rect(x, top, w, 128 - top)
      p.line([[x - 4, top], [x + w / 2, top - 16], [x + w + 4, top]], { close: true, fill: 'rgba(180,100,63,0.6)' })
      p.rect(x + w / 2 - 6, 106, 12, 22, { fill: 'rgba(43,33,24,0.55)' })
    }
  },
  lamp(p) {
    ;[52, 100, 148].forEach((x, i) => {
      p.line([[x, 4], [x, 52 + i * 6]], { color: '#9aa0a6', w: 2.2 })
      const y = 60 + i * 6; p.line([[x - 26, y], [x + 26, y], [x + 16, y + 12], [x - 16, y + 12]], { close: true, fill: 'rgba(201,162,39,0.6)' })
      for (let k = -2; k <= 2; k++) p.line([[x + k * 10, y], [x + k * 10, y - 7]], { color: '#c06a2a', w: 2 })
    })
  },
  coins(p) {
    for (let i = 0; i < 14; i++) { const x = 46 + (i % 5) * 24 + (i > 9 ? 12 : 0), y = 120 - Math.floor(i / 5) * 18; p.arc(x, y, 10, 0, Math.PI * 2, { fill: i % 3 ? GOLD : '#c0c0b8' }) }
    p.line([[30, 130], [170, 130]], { w: 1.2 })
    p.rect(130, 44, 44, 34, { fill: 'rgba(122,86,54,0.6)' }); p.rect(146, 56, 12, 10, { fill: GOLD })
  },
  ruin(p) {
    p.ground()
    p.line([[30, 128], [30, 80], [52, 70], [62, 92], [80, 66], [80, 128]], { fill: 'rgba(90,74,55,0.5)' })
    p.line([[120, 128], [120, 90], [140, 98], [150, 74], [170, 84], [170, 128]], { fill: 'rgba(90,74,55,0.5)' })
    for (let i = 0; i < 5; i++) p.line([[60 + i * 20, 60 - i * 3], [70 + i * 18, 30 - i * 5]], { color: 'rgba(90,90,90,0.6)', w: 3 })
  },
}

export const KINDS = Object.keys(DRAW)

export function drawVignette(canvas, kind, seed = 7) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  const w = canvas.clientWidth || 200, h = canvas.clientHeight || 150
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr * (w / 200), 0, 0, dpr * (h / 150), 0, 0)
  ctx.clearRect(0, 0, 200, 150)
  ;(DRAW[kind] || DRAW.house)(pen(ctx, seeded(seed + kind.length * 31)))
}

/* The illuminated capital, after the siege's manuscript.jsx. */
const PALETTES = { lapis: ['#2f4d8a', '#eed77a'], vermilion: ['#a32b25', '#eed77a'], green: ['#3f6b3a', '#eed77a'] }

export function drawCapital(canvas, letter, palette = 'lapis') {
  const paint = () => {
    const size = canvas.clientWidth || 70
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size * dpr; canvas.height = size * dpr
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const s = size / 100
    const [ground, vine] = PALETTES[palette] || PALETTES.lapis
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#eed77a'; ctx.fillRect(0, 0, size, 3 * s); ctx.fillRect(0, 0, 3 * s, size)
    ctx.fillStyle = '#8a6a14'; ctx.fillRect(0, size - 3 * s, size, 3 * s); ctx.fillRect(size - 3 * s, 0, 3 * s, size)
    ctx.fillStyle = ground; ctx.fillRect(7 * s, 7 * s, size - 14 * s, size - 14 * s)
    ctx.strokeStyle = vine; ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round'
    for (const [ox, oy, dx, dy] of [[12, 12, 1, 1], [88, 12, -1, 1], [12, 88, 1, -1], [88, 88, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(ox * s, oy * s)
      ctx.bezierCurveTo((ox + dx * 22) * s, (oy + dy * 4) * s, (ox + dx * 26) * s, (oy + dy * 20) * s, (ox + dx * 13) * s, (oy + dy * 24) * s); ctx.stroke()
      ctx.fillStyle = vine
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse((ox + dx * (13 + k * 5)) * s, (oy + dy * (26 + Math.abs(k) * 3)) * s, 3.4 * s, 2.2 * s, k * 0.7, 0, Math.PI * 2); ctx.fill() }
    }
    ctx.font = `${Math.round(size * 0.74)}px Hand, 'Iowan Old Style', Georgia, serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'
    ctx.strokeStyle = 'rgba(35,25,15,0.55)'; ctx.lineWidth = size * 0.045; ctx.strokeText(letter, size / 2, size * 0.54)
    ctx.fillStyle = '#f4ead6'; ctx.fillText(letter, size / 2, size * 0.54)
  }
  paint()
  // Canvas text does not wait for a webfont; draw again once the hand has loaded.
  if (document.fonts?.load) document.fonts.load('40px Hand').then(paint).catch(() => {})
}
