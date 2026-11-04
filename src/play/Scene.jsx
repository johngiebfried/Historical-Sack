/**
 * One scene on the leaf: the prompt, the four choices, and once a choice is
 * made, its outcome, what it gained, and what the sources say.
 */
import { useEffect, useRef, useState } from 'react'
import { drawCapital, drawVignette } from './draw/vignettes.js'
import { cardText, map, loadNotes } from './game.js'

const signed = (n) => (n > 0 ? `+${n}` : `${n}`)

export function Card({ item }) {
  const c = cardText(item)
  return (
    <div className="card">
      <div className="card-kind">{c.kind}</div>
      <div className="display card-name">{c.name}</div>
      {c.effect && <div className="card-effect">{c.effect}</div>}
    </div>
  )
}

function Reward({ choice }) {
  const parts = []
  if (choice.fama) parts.push(<span key="f"><span className={`tally ${choice.fama > 0 ? 'up' : 'down'}`}>{signed(choice.fama)}</span> fama</span>)
  if (choice.marks) parts.push(<span key="m"><span className={`tally ${choice.marks > 0 ? 'up' : 'down'}`}>{signed(choice.marks)}</span> marks of silver</span>)
  if (!parts.length) parts.push(<span key="n">No silver, and no change in fama</span>)
  return <div className="reward">{parts}</div>
}

function useNote(id, wanted) {
  const [note, setNote] = useState(null)
  useEffect(() => {
    if (!wanted) return
    let live = true
    loadNotes().then((n) => { if (live) setNote(n[id] ?? '') })
    return () => { live = false }
  }, [id, wanted])
  return note
}

function Gloss({ question, preview }) {
  const note = useNote(question.id, preview)
  const [status, ...body] = (note ?? '').split('\n')
  return (
    <>
      {question.gloss && (
        <div className="gloss">
          <h3>What the sources say</h3>
          <p>{question.gloss}</p>
        </div>
      )}
      {preview && note !== null && (
        <div className="gloss">
          <h3>Instructor&rsquo;s source note (preview only)</h3>
          <p><em>{status}</em></p>
          <details>
            <summary>Read the note</summary>
            {body.map((p, i) => <p key={i}>{p}</p>)}
          </details>
        </div>
      )}
    </>
  )
}

export default function Scene({ question, index, total, regionName, picked, gained, onPick, onNext, nextLabel, preview }) {
  const capital = useRef(null)
  const vignette = useRef(null)
  const heading = useRef(null)

  useEffect(() => {
    drawCapital(capital.current, question.prompt.trim().charAt(0).toUpperCase(), ['lapis', 'vermilion', 'green'][index % 3])
    drawVignette(vignette.current, map.stops[question.id]?.kind ?? 'house', question.id.charCodeAt(2))
    heading.current?.focus({ preventScroll: true })
  }, [question, index])

  const next = useRef(null)
  useEffect(() => {
    if (picked) next.current?.focus({ preventScroll: true })
  }, [picked])

  const chosen = picked && question.choices.find((c) => c.key === picked)
  const when = question.meta.split(' · ').slice(1).join(' · ')

  return (
    <article className="leaf vellum ink-frame" aria-labelledby={`h-${question.id}`}>
      <div className="leaf-head">
        <span className="rubric">{regionName} &middot; scene {index + 1} of {total}</span>
        <h2 className="display leaf-title" id={`h-${question.id}`} ref={heading} tabIndex={-1}>{question.title}</h2>
        <span className="meta">{when}</span>
      </div>
      <canvas className="vignette" ref={vignette} aria-hidden="true" />
      <div className="with-capital">
        <canvas className="capital" ref={capital} aria-hidden="true" />
        <p className="prompt">{question.prompt}</p>
      </div>
      <ol className="choices" aria-label="Your choices">
        {question.choices.map((c) => (
          <li key={c.key}>
            <button
              type="button"
              className={`choice${picked ? (c.key === picked ? ' chosen' : ' faded') : ''}`}
              disabled={Boolean(picked)}
              aria-pressed={c.key === picked}
              onClick={() => onPick(c.key)}
            >
              <span className="letter" aria-hidden="true">{c.key}</span>
              <span><span className="sr-only">Choice {c.key}: </span>{c.text}</span>
            </button>
          </li>
        ))}
      </ol>
      {chosen && (
        <section className="leaf" style={{ padding: 0 }} aria-live="polite">
          <p className="outcome">{chosen.outcome}</p>
          <Reward choice={chosen} />
          {gained.length > 0 && <div className="cards">{gained.map((it, i) => <Card key={i} item={it} />)}</div>}
          {chosen.kind === 'bonus' && question.rule && (
            <div className="gloss">
              <h3>What this means for the game</h3>
              {question.rule.split('\n').slice(1).filter((l) => !/^Your call/.test(l)).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          <Gloss question={question} preview={preview} />
          <div>
            <button type="button" className="quill-button rubricated" ref={next} onClick={onNext}>{nextLabel}</button>
          </div>
        </section>
      )}
    </article>
  )
}
