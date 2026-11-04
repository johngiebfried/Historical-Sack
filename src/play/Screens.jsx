/** The leaves around the scenes: joining, travelling, the confession and the result. */
import { useEffect, useRef, useState } from 'react'
import { decodeJoin } from '../core/index.js'
import { content, roster, character, regionNames } from './game.js'
import { Card } from './Scene.jsx'

function useFocusHeading() {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus({ preventScroll: true }) }, [])
  return ref
}

export function Join({ onJoin }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const heading = useFocusHeading()
  const submit = (e) => {
    e.preventDefault()
    const d = decodeJoin(code, content, roster)
    if (!d.ok) { setError(d.message); return }
    onJoin({ key: d.code, characterId: d.characterId, region: d.region, position: d.position })
  }
  return (
    <form className="leaf vellum ink-frame" onSubmit={submit} noValidate>
      <div className="leaf-head">
        <span className="rubric">The Fourth Crusade &middot; 13 April 1204</span>
        <h2 className="display leaf-title" ref={heading} tabIndex={-1}>Enter the city</h2>
      </div>
      <p style={{ margin: 0 }}>When you claimed your place in the sack, your instructor gave you a join code like <span className="tally">05H2-K</span>. It takes you to your region and your place in it.</p>
      <div className="field">
        <label htmlFor="join">Your join code</label>
        <input id="join" type="text" inputMode="text" autoComplete="off" autoCapitalize="characters" spellCheck="false"
               value={code} onChange={(e) => { setCode(e.target.value); setError('') }} aria-describedby="join-error" style={{ maxWidth: '14rem' }} />
        <span className="error" id="join-error" role="alert">{error}</span>
      </div>
      <div><button type="submit" className="quill-button rubricated">Go to my place</button></div>
      <p className="meta" style={{ margin: 0 }}>Your progress is kept on this device. If you leave and come back, enter the same code to carry on.</p>
    </form>
  )
}

/** Preview only (play.html#preview): any character, region and place, for the instructor and for review. */
export function PreviewSetup({ onStart }) {
  const [characterId, setCharacterId] = useState(5)
  const [region, setRegion] = useState('G')
  const [position, setPosition] = useState(1)
  const heading = useFocusHeading()
  return (
    <div className="leaf vellum ink-frame">
      <div className="leaf-head">
        <span className="rubric">Preview &middot; not for class use</span>
        <h2 className="display leaf-title" ref={heading} tabIndex={-1}>Choose any place</h2>
        <span className="meta">Students cannot do this: they enter the join code from claiming.</span>
      </div>
      <div className="field">
        <label htmlFor="pv-char">Character</label>
        <select id="pv-char" value={characterId} onChange={(e) => setCharacterId(Number(e.target.value))}>
          {roster.map((c) => <option key={c.id} value={c.id}>{c.id}. {c.name} ({c.faction})</option>)}
        </select>
      </div>
      <div className="field">
        <span className="meta">Region</span>
        <div className="options" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {Object.entries(content.regions).map(([k, r]) => (
            <button key={k} type="button" className="option" style={{ gridTemplateColumns: '1fr' }} aria-pressed={k === region}
                    onClick={() => { setRegion(k); setPosition(1) }}>
              <span><span className="display" style={{ fontSize: '0.95rem' }}>{r.name}</span><br /><span className="meta">{r.sub}</span></span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="meta">Place (1 is the first chosen and the richest; 6 can be played twice)</span>
        <div className="options">
          {content.positions(region).map((p) => (
            <button key={p} type="button" className="option" aria-pressed={p === position} onClick={() => setPosition(p)}>
              <span className="tally">{p}</span>
              <span>{content.question(`${region}-${p}`).title}{content.isSpecial(region, p) ? ' (the St Simeon path)' : ''}</span>
            </button>
          ))}
        </div>
      </div>
      <div><button type="button" className="quill-button rubricated" onClick={() => onStart({ key: `preview-${characterId}${region}${position}`, characterId, region, position })}>Enter the city</button></div>
    </div>
  )
}

export function Travel({ label, regionName, step, total }) {
  return (
    <div className="leaf vellum ink-frame" aria-live="polite">
      <span className="rubric">On the way</span>
      <h2 className="display leaf-title" style={{ fontSize: '1.4rem' }}>{label}</h2>
      <span className="meta">{regionName} &middot; scene {step} of {total}</span>
    </div>
  )
}

export function Confession({ collected, onSeal }) {
  const [value, setValue] = useState(String(Math.round(collected / 20) * 10))
  const [error, setError] = useState('')
  const heading = useFocusHeading()
  const seal = (e) => {
    e.preventDefault()
    const v = Number(value)
    if (value.trim() === '' || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) { setError('Enter a whole number of marks, zero or more.'); return }
    if (v > collected) { setError(`You have only ${collected} marks to hand in.`); return }
    onSeal(v)
  }
  return (
    <form className="leaf vellum ink-frame" onSubmit={seal} noValidate>
      <div className="leaf-head">
        <span className="rubric">The collection &middot; the days after the sack</span>
        <h2 className="display leaf-title" ref={heading} tabIndex={-1}>What do you hand in?</h2>
      </div>
      <p style={{ margin: 0 }}>You swore on relics to bring all gold, silver and new cloth to the common stock. The leaders have named the churches where it is to be gathered, and guards are watching, some of them. Venice is owed its money: it is paid in full only if the whole host hands in at least <span className="tally">100</span> marks for every crusader.</p>
      <p style={{ margin: 0 }}>You collected <span className="tally" style={{ fontSize: '1.3rem' }}>{collected}</span> marks of silver.</p>
      <div className="field">
        <label htmlFor="silver">Marks you hand in</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <input id="silver" type="number" min="0" max={collected} step="10" inputMode="numeric" value={value}
                 onChange={(e) => { setValue(e.target.value); setError('') }} aria-describedby="silver-error" style={{ width: '8rem' }} />
          <button type="button" className="quill-button" onClick={() => setValue('0')}>None</button>
          <button type="button" className="quill-button" onClick={() => setValue(String(Math.round(collected / 2)))}>Half</button>
          <button type="button" className="quill-button" onClick={() => setValue(String(collected))}>All</button>
        </div>
        <span className="error" id="silver-error" role="alert">{error}</span>
      </div>
      <p className="meta" style={{ margin: 0 }}>Once sealed, your confession cannot be changed.</p>
      <div><button type="submit" className="quill-button rubricated">Seal your confession</button></div>
    </form>
  )
}

export function Result({ record, totals, code, seq, onRestart }) {
  const [copied, setCopied] = useState('')
  const heading = useFocusHeading()
  const ch = character(record.characterId)
  const codeRef = useRef(null)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied('Copied.')
    } catch {
      const sel = window.getSelection(); const range = document.createRange()
      range.selectNodeContents(codeRef.current); sel.removeAllRanges(); sel.addRange(range)
      setCopied('Selected: copy it with your keyboard or the menu.')
    }
  }
  return (
    <article className="leaf vellum ink-frame">
      <div className="leaf-head">
        <span className="rubric">{ch?.name} &middot; {regionNames[record.region]}, place <span className="tally">{record.position}</span></span>
        <h2 className="display leaf-title" ref={heading} tabIndex={-1}>Your sack is recorded</h2>
      </div>
      <div style={{ display: 'grid', gap: '0.4rem' }}>
        <span className="meta">Your result code. Send exactly this to your instructor:</span>
        <span className="code" ref={codeRef}>{code}</span>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="quill-button" onClick={copy}>Copy the code</button>
          <span className="meta" aria-live="polite">{copied}</span>
        </div>
      </div>
      <div className="reward" style={{ fontSize: '1.02rem' }}>
        <span>Fama <span className="tally">{totals.fama > 0 ? '+' : ''}{totals.fama}</span></span>
        <span>Collected <span className="tally">{totals.collected}</span></span>
        <span>Handed in <span className="tally">{record.silver}</span></span>
        <span>Kept <span className="tally">{totals.collected - record.silver}</span></span>
      </div>
      {totals.items.length > 0
        ? <div className="cards">{totals.items.map((it, i) => <Card key={i} item={it} />)}</div>
        : <p className="meta" style={{ margin: 0 }}>You carry no prizes away.</p>}
      <ol className="path">
        {seq.map((id, i) => {
          const q = content.question(id)
          const c = q.choices.find((x) => x.key === record.picks[i])
          return <li key={id}><span className="rubric">{q.title}</span>: <span className="tally">{c.key}</span> {c.text}</li>
        })}
      </ol>
      {onRestart && <div><button type="button" className="quill-button" onClick={onRestart}>Preview another place</button></div>}
    </article>
  )
}
