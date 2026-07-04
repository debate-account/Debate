'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FORMATS } from '@/lib/formats';
import { DRILLS } from '@/lib/drills';
import { createClient } from '@/lib/supabase/client';
import { MAX_CUSTOM, type CustomFormatRow, type CustomDrillRow } from '@/lib/custom';

type View = 'formats' | 'modes' | 'newFormat' | 'newDrill';

export default function StartScreen({
  isLoggedIn = false,
  customFormats = [],
  customDrills = [],
}: {
  isLoggedIn?: boolean;
  customFormats?: CustomFormatRow[];
  customDrills?: CustomDrillRow[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>('formats');

  // Custom-format form
  const [fName, setFName] = useState('');
  const [fSpeeches, setFSpeeches] = useState('');
  const [fCriteria, setFCriteria] = useState('');
  const [fNotes, setFNotes] = useState('');
  // Custom-drill form
  const [dName, setDName] = useState('');
  const [dTag, setDTag] = useState('');
  const [dBlurb, setDBlurb] = useState('');
  const [dInstr, setDInstr] = useState('');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const nydl = FORMATS.find((f) => f.id === 'nydl')!;

  function pick(id: string) {
    if (id === 'nydl') { setView('modes'); return; }
    router.push(`/practice?format=${id}`);
  }

  async function saveFormat() {
    setErr(''); setSaving(true);
    const { error } = await createClient().from('custom_formats').insert({
      name: fName.trim(),
      speeches: fSpeeches.trim() || null,
      criteria: fCriteria.trim() || null,
      description: fNotes.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setFName(''); setFSpeeches(''); setFCriteria(''); setFNotes('');
    setView('formats');
    router.refresh();
  }

  async function saveDrill() {
    setErr(''); setSaving(true);
    const { error } = await createClient().from('custom_drills').insert({
      name: dName.trim(),
      tag: dTag.trim() || null,
      blurb: dBlurb.trim() || null,
      instructions: dInstr.trim(),
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setDName(''); setDTag(''); setDBlurb(''); setDInstr('');
    setView('formats');
    router.refresh();
  }

  async function del(table: 'custom_formats' | 'custom_drills', id: string) {
    if (!confirm('Delete this? This can’t be undone.')) return;
    const { error } = await createClient().from(table).delete().eq('id', id);
    if (error) { alert(error.message); return; }
    router.refresh();
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

  // Create-and-save a custom format (logged in).
  if (view === 'newFormat') {
    return (
      <div className="wrap">
        <button className="btn btn-ghost" onClick={() => { setErr(''); setView('formats'); }}>&larr; Back</button>
        <div className="eyebrow" style={{ marginTop: 14 }}>New custom format</div>
        <h1 className="h-hero">Build a round format</h1>
        <p className="lead">Save a format you run often. Your opponent and judge follow its structure every time.</p>
        <label className="fld-label">Name</label>
        <input className="field" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Karl Popper" />
        <label className="fld-label">Speech times — one per line</label>
        <textarea className="field" style={{ minHeight: 110, resize: 'vertical' }} value={fSpeeches}
          onChange={(e) => setFSpeeches(e.target.value)}
          placeholder={'Constructive — 6 min\nCross-examination — 3 min\nRebuttal — 5 min'} />
        <label className="fld-label">Judging criteria — one per line (optional)</label>
        <textarea className="field" style={{ minHeight: 80, resize: 'vertical' }} value={fCriteria}
          onChange={(e) => setFCriteria(e.target.value)}
          placeholder={'Content — argument quality and clash\nStyle — clarity and persuasion\nStrategy — structure and time use'} />
        <label className="fld-label">Rules &amp; notes (optional)</label>
        <textarea className="field" style={{ minHeight: 70, resize: 'vertical' }} value={fNotes}
          onChange={(e) => setFNotes(e.target.value)}
          placeholder="Teams of 3; points of information allowed after the first minute…" />
        {err && <p className="err">{err}</p>}
        <button className="btn btn-primary" style={{ marginTop: 4 }} disabled={!fName.trim() || saving} onClick={saveFormat}>
          {saving ? 'Saving…' : 'Save format'}
        </button>
      </div>
    );
  }

  // Create-and-save a custom drill (logged in).
  if (view === 'newDrill') {
    return (
      <div className="wrap">
        <button className="btn btn-ghost" onClick={() => { setErr(''); setView('formats'); }}>&larr; Back</button>
        <div className="eyebrow" style={{ marginTop: 14 }}>New custom drill</div>
        <h1 className="h-hero">Build a coaching drill</h1>
        <p className="lead">Describe what the drill should make you practice — the coach sets up a scenario and grades your reps.</p>
        <label className="fld-label">Name</label>
        <input className="field" value={dName} onChange={(e) => setDName(e.target.value)} placeholder="e.g. Handling points of information" />
        <label className="fld-label">Short label (optional)</label>
        <input className="field" value={dTag} onChange={(e) => setDTag(e.target.value)} placeholder="e.g. Poise under pressure" />
        <label className="fld-label">Card description (optional)</label>
        <input className="field" value={dBlurb} onChange={(e) => setDBlurb(e.target.value)} placeholder="One line the card shows you." />
        <label className="fld-label">What should this drill make you practice?</label>
        <textarea className="field" style={{ minHeight: 110, resize: 'vertical' }} value={dInstr}
          onChange={(e) => setDInstr(e.target.value)}
          placeholder="e.g. Throw me points of information mid-speech. Grade whether I take good ones, wave off bad ones, and stay fluent." />
        {err && <p className="err">{err}</p>}
        <button className="btn btn-primary" style={{ marginTop: 4 }} disabled={!dName.trim() || !dInstr.trim() || saving} onClick={saveDrill}>
          {saving ? 'Saving…' : 'Save drill'}
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
        {FORMATS.map((f) => (
          <button key={f.id} className={`choice ${f.cls}`} onClick={() => pick(f.id)}>
            <span className="edge" />
            <span className="tag">{f.tag}</span>
            <h3>{f.name}</h3>
            <p>{f.blurb}</p>
            <ul className="speeches">
              {f.speeches.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <div className="go">{f.id === 'nydl' ? 'Choose round →' : 'Start →'}</div>
          </button>
        ))}
        {/* Logged-in: saved custom formats + a create card, right in the formats grid. */}
        {isLoggedIn && customFormats.map((f) => (
          <div key={f.id} className="choice prep custom-card" onClick={() => router.push(`/practice?customFormat=${f.id}`)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/practice?customFormat=${f.id}`); }}>
            <button className="choice-del" aria-label="Delete format" onClick={(e) => { e.stopPropagation(); del('custom_formats', f.id); }}>✕</button>
            <span className="edge" />
            <span className="tag">Custom format</span>
            <h3>{f.name}</h3>
            <p>{f.description || 'Your saved round format.'}</p>
            <div className="go">Start →</div>
          </div>
        ))}
        {isLoggedIn && customFormats.length < MAX_CUSTOM && (
          <button className="choice add-card" onClick={() => { setErr(''); setView('newFormat'); }}>
            <span className="plus">+</span>
            <h3>New custom format</h3>
            <p>Save a round format you run often.</p>
          </button>
        )}
      </div>

      <div className="eyebrow" style={{ marginTop: 40 }}>Or drill one skill</div>
      <h2 className="drills-head">Skill drills</h2>
      <p className="lead" style={{ marginBottom: 18 }}>No opponent — just a scenario, your response, and targeted coaching.</p>
      <div className="fmt-grid">
        {DRILLS.map((d) => (
          <button key={d.id} className="choice drill" onClick={() => router.push(`/practice?drill=${d.id}`)}>
            <span className="edge" />
            <span className="tag">{d.tag}</span>
            <h3>{d.name}</h3>
            <p>{d.blurb}</p>
            <div className="go">Start drill →</div>
          </button>
        ))}
        {/* Logged-in: saved custom drills + a create card, right in the drills grid. */}
        {isLoggedIn && customDrills.map((d) => (
          <div key={d.id} className="choice drill custom-card" onClick={() => router.push(`/practice?customDrill=${d.id}`)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/practice?customDrill=${d.id}`); }}>
            <button className="choice-del" aria-label="Delete drill" onClick={(e) => { e.stopPropagation(); del('custom_drills', d.id); }}>✕</button>
            <span className="edge" />
            <span className="tag">{d.tag || 'Custom drill'}</span>
            <h3>{d.name}</h3>
            <p>{d.blurb || 'Your saved coaching drill.'}</p>
            <div className="go">Start drill →</div>
          </div>
        ))}
        {isLoggedIn && customDrills.length < MAX_CUSTOM && (
          <button className="choice drill add-card" onClick={() => { setErr(''); setView('newDrill'); }}>
            <span className="plus">+</span>
            <h3>New custom drill</h3>
            <p>Save a coaching drill of your own.</p>
          </button>
        )}
      </div>
    </div>
  );
}
