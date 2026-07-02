'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FORMATS, OTHER } from '@/lib/formats';

export default function StartScreen() {
  const router = useRouter();
  const [view, setView] = useState<'formats' | 'modes' | 'other'>('formats');
  const [custom, setCustom] = useState('');

  const nydl = FORMATS.find((f) => f.id === 'nydl')!;

  function pick(id: string) {
    if (id === 'nydl') { setView('modes'); return; }
    if (id === 'other') { setView('other'); return; }
    router.push(`/practice?format=${id}`);
  }

  // NYDL / ESU sub-modes (prepared vs impromptu).
  if (view === 'modes') {
    return (
      <div className="wrap">
        <button className="btn btn-ghost" onClick={() => setView('formats')}>&larr; Formats</button>
        <div className="eyebrow" style={{ marginTop: 14 }}>NYDL / ESU</div>
        <h1 className="h-hero">What kind of round?</h1>
        <p className="lead">Pick how you want to practice today.</p>
        <div className="choices">
          {nydl.modes!.map((m) => (
            <button key={m.id} className={`choice ${m.id === 'prepared' ? 'prep' : 'impromptu'}`}
              onClick={() => router.push(`/practice?format=nydl&mode=${m.id}`)}>
              <span className="edge" />
              <span className="tag">{m.name.split(' ')[0]}</span>
              <h3>{m.name}</h3>
              <p>{m.blurb}</p>
              <div className="go">Start {m.id} &rarr;</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Custom format.
  if (view === 'other') {
    return (
      <div className="wrap">
        <button className="btn btn-ghost" onClick={() => setView('formats')}>&larr; Formats</button>
        <div className="eyebrow" style={{ marginTop: 14 }}>Custom format</div>
        <h1 className="h-hero">Describe your format</h1>
        <p className="lead">Name the format and its speech times or rules — your opponent and judge will run the round that way.</p>
        <textarea className="field" style={{ minHeight: 130, resize: 'vertical' }} value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. Karl Popper — 6-min constructives, 3-min cross-ex, 5-min rebuttals, teams of 3…" />
        <button className="btn btn-primary" disabled={!custom.trim()} style={{ marginTop: 4 }}
          onClick={() => router.push(`/practice?format=other&desc=${encodeURIComponent(custom.trim())}`)}>
          Start round &rarr;
        </button>
      </div>
    );
  }

  // Format grid.
  return (
    <div className="wrap-wide">
      <div className="eyebrow">New round</div>
      <h1 className="h-hero">Pick a debate format</h1>
      <p className="lead">Each runs with its own structure, speech times, and judging.</p>
      <div className="fmt-grid">
        {[...FORMATS, OTHER].map((f) => (
          <button key={f.id} className={`choice ${f.cls}`} onClick={() => pick(f.id)}>
            <span className="edge" />
            <span className="tag">{f.tag}</span>
            <h3>{f.name}</h3>
            <p>{f.blurb}</p>
            <ul className="speeches">
              {f.speeches.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <div className="go">{f.id === 'nydl' ? 'Choose round →' : f.id === 'other' ? 'Describe →' : 'Start →'}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
