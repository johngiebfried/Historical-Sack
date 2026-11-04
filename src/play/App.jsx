/**
 * The student page.
 *
 *   play.html           a student enters the join code from claiming
 *   play.html#preview   any place, for the instructor and for review
 *
 * Progress is saved after every step, so a refresh or a closed tab resumes
 * exactly where the student was. The result code is all the instructor needs.
 */
import { useCallback, useMemo, useState } from 'react'
import { content, map, isDraft, regionNames, newRecord, stageOf, totalsOf, codeOf, character, storage } from './game.js'
import MapPanel from './MapPanel.jsx'
import Scene from './Scene.jsx'
import { Join, PreviewSetup, Travel, Confession, Result } from './Screens.jsx'

const preview = typeof location !== 'undefined' && location.hash === '#preview'

/* A saved record always resumes, finished or not: a student who reloads after sealing still needs to see their code. */
function initialRecord() {
  if (preview) return null
  const key = storage.last()
  return (key && storage.load(key)) || null
}

export default function App() {
  const [record, setRecord] = useState(initialRecord)
  // The scene the banner has reached. A resumed record is already there; a new scene must be walked to.
  const [arrived, setArrived] = useState(() => (record ? record.ack : -1))

  const update = useCallback((next) => {
    setRecord(next)
    if (next) storage.save(next)
  }, [])

  const stage = stageOf(record)
  // The route changes only when the place does, so the banner's walk is not restarted by each choice.
  const region = record?.region ?? null
  const position = record?.position ?? null
  const seq = useMemo(() => (region ? content.sequence(region, position) : []), [region, position])
  const route = useMemo(() => (seq.length ? [map.start, ...seq.map((id) => map.stops[id])] : []), [seq])
  const regionName = record ? regionNames[record.region] : ''

  const start = (slot) => {
    const saved = preview ? null : storage.load(slot.key)
    const rec = saved ?? newRecord(slot)
    update(rec)
    setArrived(saved ? rec.ack : -1)
  }

  let leaf
  let mapAt = null
  let focus = 'city'
  let where = 'Constantinople, April 1204'

  if (stage === 'start') {
    leaf = preview
      ? <PreviewSetup onStart={start} />
      : <Join onJoin={start} />
  } else if (stage === 'scene' || stage === 'outcome') {
    const index = stage === 'scene' ? record.ack : record.picks.length - 1
    const q = content.question(seq[index])
    mapAt = index + 1
    where = map.stops[q.id].label
    if (stage === 'scene' && arrived !== index) {
      focus = 'region'
      leaf = <Travel label={map.stops[q.id].label} regionName={regionName} step={index + 1} total={seq.length} />
    } else {
      focus = 'stop'
      const gained = stage === 'outcome' ? totalsOf(record).items.filter((it) => it.from === q.id) : []
      const last = index === seq.length - 1
      leaf = (
        <Scene
          key={q.id}
          question={q}
          index={index}
          total={seq.length}
          regionName={regionName}
          picked={stage === 'outcome' ? record.picks[index] : null}
          gained={gained}
          preview={preview}
          onPick={(k) => update({ ...record, picks: [...record.picks, k] })}
          onNext={() => update({ ...record, ack: record.ack + 1 })}
          nextLabel={last ? 'To the collection' : 'Move on'}
        />
      )
    }
  } else if (stage === 'confess') {
    mapAt = seq.length
    focus = 'route'
    where = 'The collection'
    leaf = <Confession collected={totalsOf(record).collected} onSeal={(silver) => update({ ...record, silver })} />
  } else {
    mapAt = seq.length
    focus = 'route'
    where = 'Your route through the city'
    leaf = (
      <Result
        record={record}
        totals={totalsOf(record)}
        code={codeOf(record)}
        seq={seq}
        onRestart={preview ? () => { storage.forget(record.key); setRecord(null); setArrived(-1) } : null}
      />
    )
  }

  const done = record ? Math.min(record.ack, seq.length) : 0
  const ch = record && character(record.characterId)

  return (
    <div className="play">
      <header className="bar">
        <span className="display title">The Sack of Constantinople</span>
        {ch && (
          <span className="who">
            {ch.name} &middot; {regionName}, place <span className="tally">{record.position}</span>
            {!preview && <> &middot; <button type="button" className="linklike" onClick={() => { setRecord(null); setArrived(-1) }}>Use a different code</button></>}
          </span>
        )}
      </header>
      {isDraft && <div className="draft">Draft content: not yet approved for class use{preview ? ' · preview mode' : ''}</div>}
      <main className="stage">
        <MapPanel
          region={record?.region ?? null}
          route={route}
          at={mapAt}
          from={arrived + 1}
          done={done}
          focus={focus}
          label={where}
          onArrive={(i) => setArrived(i - 1)}
        />
        <div className="side">
          {record && (
            <ol className="sr-only" aria-label="Your route">
              {seq.map((id, i) => (
                <li key={id}>{map.stops[id].label}: {i < done ? 'done' : i === done ? 'now' : 'to come'}</li>
              ))}
            </ol>
          )}
          {leaf}
        </div>
      </main>
    </div>
  )
}

