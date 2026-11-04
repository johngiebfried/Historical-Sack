/**
 * The plan of the city, with the player's route and banner.
 *
 * The banner stands at route[at]. When `at` changes it walks there (or jumps,
 * if the player prefers reduced motion) and then calls onArrive. The view
 * eases between the whole city, the region and the current stop.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPainter } from './draw/mapPainter.js'
import { map, regionNames } from './game.js'

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function frameFor(focus, route, at) {
  if (focus === 'city' || !route?.length) return { cx: 2, cz: 2, span: 84 }
  if (focus === 'stop') {
    const p = route[at]
    return { cx: p.x, cz: p.z, span: 24 }
  }
  // Walking: the leg from the breach takes in the whole way across the city; later legs, just this place's stops.
  const pts = focus === 'region' ? (at <= 1 ? route.slice(0, 2) : route.slice(1)) : route.slice(0, at + 1)
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2
  const span = Math.max(26, (Math.max(...xs) - Math.min(...xs)) * 1.5, (Math.max(...zs) - Math.min(...zs)) * 2.2)
  return { cx, cz, span }
}

export default function MapPanel({ region, route, at, from, done, focus, onArrive, label }) {
  const canvasRef = useRef(null)
  const live = useRef({ walker: null, route: null, travel: null, view: { cx: 2, cz: 2, span: 84 }, target: { cx: 2, cz: 2, span: 84 }, dirty: true })
  const props = useRef({})
  useLayoutEffect(() => {
    props.current = { region, route, done, onArrive }
    live.current.dirty = true
  })

  // Walk (or jump) to the new stop. A new route (a new place) starts the banner afresh at `from`:
  // the breach for a new run, the current scene for a resumed one.
  useEffect(() => {
    const s = live.current
    if (!route?.length || at == null) {
      s.walker = null
      s.travel = null
      s.dirty = true
      return
    }
    if (s.route !== route) {
      s.route = route
      const f = route[Math.min(from ?? at, route.length - 1)]
      s.walker = { x: f.x, z: f.z }
      s.travel = null
    }
    const to = route[at]
    if (!s.walker || reducedMotion()) {
      s.walker = { x: to.x, z: to.z }
      s.travel = null
      s.dirty = true
      queueMicrotask(() => props.current.onArrive?.(at))
      return
    }
    if (s.walker.x === to.x && s.walker.z === to.z) {
      queueMicrotask(() => props.current.onArrive?.(at))
      return
    }
    const dist = Math.hypot(to.x - s.walker.x, to.z - s.walker.z)
    s.travel = { from: { ...s.walker }, to, t: 0, dur: Math.min(3.2, 0.9 + dist / 14), at }
  }, [route, at, from])

  useEffect(() => {
    live.current.target = frameFor(focus, route, at ?? 0)
    live.current.dirty = true
  }, [focus, route, at])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const paint = createPainter(map, regionNames)
    const clock = { last: performance.now(), lastDraw: 0, raf: 0 }
    const size = { W: 0, H: 0, dpr: 1 }
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      size.dpr = Math.min(2, window.devicePixelRatio || 1)
      size.W = r.width; size.H = r.height
      canvas.width = Math.round(size.W * size.dpr); canvas.height = Math.round(size.H * size.dpr)
      live.current.dirty = true
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    const tick = (now) => {
      const s = live.current
      const dt = Math.min(0.05, (now - clock.last) / 1000)
      clock.last = now
      let moving = false
      for (const k of ['cx', 'cz', 'span']) {
        const d = s.target[k] - s.view[k]
        if (Math.abs(d) > 0.01) moving = true
        s.view[k] += reducedMotion() ? d : d * Math.min(1, dt * 2.6)
      }
      if (s.travel) {
        const tr = s.travel
        tr.t += dt / tr.dur
        const e = tr.t >= 1 ? 1 : 0.5 - Math.cos(Math.PI * tr.t) / 2
        s.walker = { x: tr.from.x + (tr.to.x - tr.from.x) * e, z: tr.from.z + (tr.to.z - tr.from.z) * e }
        if (tr.t >= 1) {
          s.travel = null
          props.current.onArrive?.(tr.at)
        }
      }
      // Full rate while anything moves; at rest only the banner stirs, so about 12 frames a second is enough.
      if (moving || s.travel || s.dirty || now - clock.lastDraw > 83) {
        clock.lastDraw = now
        s.dirty = false
        const p = props.current
        const { W, H, dpr } = size
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        paint(ctx, { W, H, view: s.view, region: p.region, route: p.route, done: p.done, walker: s.walker, t: reducedMotion() ? 0 : now / 1000 })
      }
      clock.raf = requestAnimationFrame(tick)
    }
    clock.raf = requestAnimationFrame(tick)
    document.fonts?.load('16px Hand').then(() => { live.current.dirty = true }).catch(() => {})
    return () => {
      cancelAnimationFrame(clock.raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="mapwrap">
      <canvas ref={canvasRef} role="img" aria-label={`Plan of Constantinople. ${label}`} />
      <div className="where vellum ink-frame" aria-hidden="true">{label}</div>
    </div>
  )
}
