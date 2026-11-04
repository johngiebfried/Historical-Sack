/*
 * The city plan, painted to a canvas from src/data/map.json.
 *
 * Everything positional comes from the map file: coastlines, regions, stops,
 * place names. When the instructor's own map replaces the placeholder, this
 * painter draws a base image instead of the coastlines, and nothing else in
 * the game changes.
 */
const INK = '#2b2118', RUB = '#a32b25', GOLD = '#c9a227'

function rng(seed) {
  let a = seed
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0
    return a / 4294967296
  }
}

function inside(poly, x, z) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}

export function createPainter(map, regionNames) {
  const geo = map.geo
  // A fixed scatter of houses inside the walls, the same on every draw.
  const houses = []
  const r = rng(11)
  for (let i = 0; i < 900 && houses.length < 340; i++) {
    const x = -30 + r() * 64
    const z = -20 + r() * 44
    if (x > geo.landWall.x + 0.6 && inside(geo.peninsula, x, z)) houses.push([x, z, r()])
  }

  return function paint(ctx, { W, H, view, region, route, done, walker, t, banner = true }) {
    const scale = Math.min(W, H * 1.35) / view.span
    const X = (x) => W / 2 + (x - view.cx) * scale
    const Y = (z) => H / 2 + (z - view.cz) * scale

    const poly = (pts, fill, stroke, lw = 1.2) => {
      ctx.beginPath()
      pts.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))))
      ctx.closePath()
      if (fill) { ctx.fillStyle = fill; ctx.fill() }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke() }
    }
    const label = (text, x, z, { size = 14, color = INK, italic = false, align = 'center' } = {}) => {
      ctx.font = `${italic ? 'italic ' : ''}${size}px Hand, Georgia, serif`
      ctx.textAlign = align; ctx.textBaseline = 'middle'
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(239,226,196,0.85)'; ctx.strokeText(text, X(x), Y(z))
      ctx.fillStyle = color; ctx.fillText(text, X(x), Y(z))
    }
    const glyphs = {
      dome(x, z, r = 1, wash = '#a8b0ad') {
        const cx = X(x), cy = Y(z), s = scale * r
        ctx.fillStyle = '#ded2ba'; ctx.fillRect(cx - s * 1.4, cy - s * 0.2, s * 2.8, s * 1.1)
        ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(cx - s * 1.4, cy - s * 0.2, s * 2.8, s * 1.1)
        ctx.beginPath(); ctx.arc(cx, cy - s * 0.2, s, Math.PI, 0); ctx.fillStyle = wash; ctx.fill(); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy - s * 1.2); ctx.lineTo(cx, cy - s * 1.7); ctx.moveTo(cx - s * 0.2, cy - s * 1.5); ctx.lineTo(cx + s * 0.2, cy - s * 1.5); ctx.stroke()
      },
      tower(x, z, r = 1) {
        const cx = X(x), cy = Y(z), s = scale * r
        ctx.fillStyle = '#d8cdb4'; ctx.fillRect(cx - s / 2, cy - s * 1.6, s, s * 1.6)
        ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(cx - s / 2, cy - s * 1.6, s, s * 1.6)
        ctx.fillStyle = RUB; ctx.fillRect(cx - s / 2, cy - s * 0.8, s, s * 0.12)
      },
      palace(x, z, r = 1) {
        const cx = X(x), cy = Y(z), s = scale * r
        ctx.fillStyle = '#ded2ba'; ctx.fillRect(cx - s * 1.8, cy - s, s * 3.6, s * 1.2)
        ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(cx - s * 1.8, cy - s, s * 3.6, s * 1.2)
        ctx.beginPath(); ctx.moveTo(cx - s * 2, cy - s); ctx.lineTo(cx, cy - s * 1.9); ctx.lineTo(cx + s * 2, cy - s); ctx.closePath()
        ctx.fillStyle = 'rgba(180,100,63,0.85)'; ctx.fill(); ctx.stroke()
      },
      hippodrome(x, z) {
        const cx = X(x), cy = Y(z), s = scale
        ctx.beginPath(); ctx.moveTo(cx - s * 4, cy - s * 1.1); ctx.lineTo(cx + s * 3, cy - s * 1.1)
        ctx.arc(cx + s * 3, cy, s * 1.1, -Math.PI / 2, Math.PI / 2); ctx.lineTo(cx - s * 4, cy + s * 1.1); ctx.closePath()
        ctx.fillStyle = '#d8c79c'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx - s * 3, cy); ctx.lineTo(cx + s * 2.6, cy); ctx.lineWidth = 2; ctx.stroke()
      },
    }

    // Water, with the scribe's wavelets.
    ctx.fillStyle = '#86a3a1'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(30,59,69,0.35)'; ctx.lineWidth = 1
    const step = Math.max(14, scale * 2.2)
    for (let y = Y(-60) % step; y < H; y += step) {
      for (let x = ((y / step) % 2) * step * 0.6; x < W; x += step * 1.4) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + step * 0.25, y - 3, x + step * 0.5, y); ctx.stroke()
      }
    }

    // Land, the city, its ridge and its houses.
    poly(geo.europe, '#e3d3ab', INK, 1.4)
    poly(geo.asia, '#e0cfa6', INK, 1.4)
    poly(geo.galata, '#e3d3ab', INK, 1.2)
    poly(geo.peninsula, '#efe2c4', null)
    ctx.strokeStyle = 'rgba(90,74,55,0.45)'; ctx.lineWidth = 1
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI * 2
      const x = geo.ridge.cx + Math.cos(a) * geo.ridge.rx * 0.6
      const z = geo.ridge.cz + Math.sin(a) * geo.ridge.rz * 0.5
      ctx.beginPath(); ctx.arc(X(x), Y(z) + scale, scale * 1.4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke()
    }
    const hw = Math.max(3, Math.min(9, scale * 0.64)), hh = hw * 0.68
    for (const [x, z, k] of houses) { ctx.fillStyle = k > 0.85 ? '#8fa3a8' : '#b4643f'; ctx.fillRect(X(x) - hw / 2, Y(z) - hh / 2, hw, hh) }

    // Sea walls along the shore, and the land walls facing Thrace.
    poly(geo.peninsula, null, INK, Math.max(1.6, scale * 0.28))
    for (let i = 0; i < geo.peninsula.length; i += 3) {
      const [x, z] = geo.peninsula[i]
      ctx.fillStyle = INK; ctx.fillRect(X(x) - scale * 0.25, Y(z) - scale * 0.25, scale * 0.5, scale * 0.5)
    }
    const lw = geo.landWall
    ctx.strokeStyle = INK
    for (const dx of [0, 0.9]) {
      ctx.lineWidth = Math.max(1.6, scale * (dx ? 0.18 : 0.32))
      ctx.beginPath(); ctx.moveTo(X(lw.x - dx), Y(lw.from)); ctx.lineTo(X(lw.x - dx), Y(lw.to)); ctx.stroke()
    }
    for (let z = lw.from + 1; z < lw.to; z += 2.2) glyphs.tower(lw.x, z, 0.55)

    // Regions: the player's tinted and outlined; all named before a run starts.
    const big = Math.max(12, Math.min(20, scale * 1.6))
    for (const [k, reg] of Object.entries(map.regions)) {
      const on = k === region
      const [rx, rz, tilt] = reg.shape
      ctx.beginPath(); ctx.ellipse(X(reg.centre[0]), Y(reg.centre[1]), scale * rx, scale * rz, tilt, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${reg.tint},${on ? 0.22 : 0.07})`; ctx.fill()
      if (on) { ctx.setLineDash([5, 4]); ctx.strokeStyle = `rgba(${reg.tint},0.9)`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]) }
    }

    // Places and their names.
    for (const p of map.places) {
      if (p.glyphAt) glyphs[p.glyph]?.(p.glyphAt[0], p.glyphAt[1], p.size ?? 1, p.wash)
    }
    for (const w of map.waters) label(w.name, w.at[0], w.at[1], { size: big + (w.name.includes('Marmara') ? 2 : 0), italic: true, color: '#1e3b45' })
    for (const l of map.lands) label(l.name, l.at[0], l.at[1], { size: big - 1, italic: true })
    for (const p of map.places) {
      if (p.big) label(p.name, p.at[0], p.at[1], { size: big - 1 })
      else if (scale > 9) label(p.name, p.at[0], p.at[1], { size: big - 4, align: p.align ?? 'center' })
    }
    for (const [k, reg] of Object.entries(map.regions)) {
      if (region && k !== region) continue
      label(regionNames[k].replace(/^The /, ''), reg.label[0], reg.label[1], { size: big + (k === region ? 3 : 0), color: k === region ? RUB : INK })
    }

    // The route so far, the numbered stops, and the banner.
    if (route?.length) {
      const visible = Math.min(route.length, done + 2)
      ctx.setLineDash([scale * 0.6, scale * 0.5]); ctx.strokeStyle = RUB; ctx.lineWidth = Math.max(2, scale * 0.22)
      ctx.beginPath()
      for (let i = 0; i < visible; i++) {
        const p = i === visible - 1 && walker ? walker : route[i]
        if (i) ctx.lineTo(X(p.x), Y(p.z)); else ctx.moveTo(X(p.x), Y(p.z))
      }
      ctx.stroke(); ctx.setLineDash([])
      route.slice(1).forEach((p, i) => {
        const cx = X(p.x), cy = Y(p.z), rr = Math.max(9, scale * 0.9)
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fillStyle = i < done ? GOLD : '#f7eed9'; ctx.fill()
        ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke()
        ctx.font = `700 ${Math.round(rr * 1.1)}px 'Iowan Old Style', Georgia, serif`; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(i + 1), cx, cy + 1)
      })
    }
    if (walker && banner) {
      const cx = X(walker.x), cy = Y(walker.z), s = Math.max(1, scale / 9)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy, 8 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = INK; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 40 * s); ctx.stroke()
      const wave = Math.sin(t * 6) * 2 * s
      ctx.beginPath(); ctx.moveTo(cx, cy - 40 * s); ctx.lineTo(cx + 24 * s, cy - 36 * s + wave); ctx.lineTo(cx + 17 * s, cy - 30 * s)
      ctx.lineTo(cx + 24 * s, cy - 24 * s + wave); ctx.lineTo(cx, cy - 26 * s); ctx.closePath()
      ctx.fillStyle = '#b8402f'; ctx.fill(); ctx.lineWidth = 1.2 * s; ctx.stroke()
      ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 2 * s; ctx.beginPath()
      ctx.moveTo(cx + 9 * s, cy - 37 * s); ctx.lineTo(cx + 9 * s, cy - 29 * s); ctx.moveTo(cx + 5 * s, cy - 33 * s); ctx.lineTo(cx + 13 * s, cy - 33 * s); ctx.stroke()
    }
  }
}
