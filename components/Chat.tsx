'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/components/Settings';
import { renderMarkdown, stripMeta, parseRoundMeta } from '@/lib/markdown';
import { roundLabel, parseSpeechTimers, DEFAULT_SPEECHES, DEFAULT_CRITERIA, type RoundFormat } from '@/lib/formats';

type Msg = { role: 'user' | 'assistant'; content: string };
const MODES = [
  { key: 'OPPONENT', label: 'Opponent', cls: '' },
  { key: 'JUDGE', label: 'Judge', cls: 'judge' },
  { key: 'COACH', label: 'Coach', cls: 'coach' },
];

// Strip markdown symbols so the AI voice reads clean prose.
function toSpeech(s: string) {
  return stripMeta(s).replace(/[#*_`>]/g, ' ').replace(/^\s*[-]\s+/gm, ' ').replace(/\s+/g, ' ').trim();
}
function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
// Short beep when a speech timer hits zero.
function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 400);
  } catch {}
}

export default function Chat({ format, isGuest }: { format: RoundFormat; isGuest: boolean }) {
  const isImpromptu = format.id === 'nydl' && format.mode === 'impromptu';
  const isDrill = !!format.drill;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [listening, setListening] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { voiceURI, volume, wpm } = useSettings();
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);
  const baseTextRef = useRef('');
  const keepListeningRef = useRef(false); // true while the user intends to keep speaking
  const finalRef = useRef('');            // accumulated finalized transcript this session
  const autoSendRef = useRef(false);      // voice mode sends the speech on stop

  // Round briefing — editable speech times + judging criteria, confirmed before start.
  const hasTimes = format.speeches.some((s) => /\d+\s*min/i.test(s));
  const [speechesText, setSpeechesText] = useState((hasTimes ? format.speeches : DEFAULT_SPEECHES).join('\n'));
  const [criteriaText, setCriteriaText] = useState((format.criteria?.length ? format.criteria : DEFAULT_CRITERIA).join('\n'));
  const speechesArr = useMemo(() => speechesText.split('\n').map((s) => s.trim()).filter(Boolean), [speechesText]);
  const criteriaArr = useMemo(() => criteriaText.split('\n').map((s) => s.trim()).filter(Boolean), [criteriaText]);
  const timers = useMemo(() => parseSpeechTimers(speechesArr), [speechesArr]);

  // Countdown timer (voice mode) that auto-loads the chosen speech's length.
  const [speechIdx, setSpeechIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const target = timers[speechIdx]?.seconds ?? 0;

  // Detect browser capabilities after mount so the first client render matches
  // the server (both "unsupported"), avoiding a hydration mismatch.
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  useEffect(() => {
    setSpeechSupported(('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
    setTtsSupported('speechSynthesis' in window);
  }, []);

  const words = useMemo(() => (input.trim() ? input.trim().split(/\s+/).length : 0), [input]);
  const speakSecs = wpm > 0 ? Math.round((words / wpm) * 60) : 0;

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Load the selected speech's time onto the clock when idle (or when its time is edited).
  useEffect(() => {
    if (!running) { setRemaining(target); setDone(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechIdx, target]);

  // Countdown tick.
  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); setDone(true); beep(); return; }
    const id = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  // Stop any audio/recognition when unmounting.
  useEffect(() => () => {
    keepListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  function toggleTimer() {
    if (running) { setRunning(false); return; }
    if (remaining <= 0) setRemaining(target);
    setDone(false);
    setRunning(true);
  }
  function resetTimer() { setRunning(false); setDone(false); setRemaining(target); }

  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.42) + 'px';
  }

  function speak(text: string) {
    if (!ttsSupported) return;
    const u = new SpeechSynthesisUtterance(toSpeech(text));
    u.volume = volume;
    if (voiceURI) {
      const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI);
      if (v) u.voice = v;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    requestAnimationFrame(autosize);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, format: { ...format, speeches: speechesArr, criteria: criteriaArr } }),
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 429
          ? '(Trial limit reached — sign up or log in to keep practicing.)'
          : '(Could not reach the opponent — check the API key in .env.local.)';
        setMessages((m) => [...m, { role: 'assistant', content: msg }]);
        setBusy(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);
      for (;;) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: acc }; return c; });
      }
      if (mode === 'voice' && acc) speak(acc);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '(Something went wrong.)' }]);
    }
    setBusy(false);
  }

  // Continuous Web Speech recognition. Both flows accumulate a full transcript
  // through pauses (a whole speech), showing it live in the composer:
  //   autoSend=true  (voice mode)  — on stop, send the speech as the user's turn.
  //   autoSend=false (dictation)   — on stop, leave it in the box to edit/send.
  function stopListening() {
    keepListeningRef.current = false;
    try { recRef.current?.stop(); } catch {}
  }

  function startListening(autoSend: boolean) {
    if (!speechSupported) return;
    if (listening) { stopListening(); return; }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    autoSendRef.current = autoSend;
    baseTextRef.current = autoSend ? '' : (input ? input + ' ' : '');
    finalRef.current = '';
    keepListeningRef.current = true;

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    recRef.current = r;

    r.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalRef.current += res[0].transcript + ' ';
        else interim += res[0].transcript;
      }
      setInput((baseTextRef.current + finalRef.current + interim).replace(/\s+/g, ' ').trimStart());
      requestAnimationFrame(autosize);
    };
    r.onerror = (ev: any) => {
      // Mic blocked or unavailable — stop for good and let the user know.
      if (ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed' || ev?.error === 'audio-capture') {
        keepListeningRef.current = false;
        setListening(false);
        alert('Microphone unavailable — allow mic access to speak.');
      }
    };
    r.onend = () => {
      // Browsers end recognition after silence; if the user hasn't stopped, keep going.
      if (keepListeningRef.current) { try { r.start(); return; } catch {} }
      setListening(false);
      const finalText = (baseTextRef.current + finalRef.current).replace(/\s+/g, ' ').trim();
      if (autoSendRef.current && finalText) { setInput(''); send(finalText); }
    };
    try { r.start(); setListening(true); } catch {}
  }

  function switchMode(m: 'text' | 'voice') {
    if (m === mode) return;
    stopListening();
    setListening(false);
    if (ttsSupported) window.speechSynthesis.cancel();
    setMode(m);
  }

  function startRound() {
    if (isDrill) { send(format.kickoff || 'Start the drill.'); return; }
    if (format.id === 'nydl') {
      send(isImpromptu
        ? 'IMPROMPTU'
        : "Let's run a prepared round. Ask me your setup questions — the motion, my side, and team size — then wait for me to begin.");
      return;
    }
    const times = speechesArr.length ? ` Speech structure: ${speechesArr.join('; ')}.` : '';
    const crit = criteriaArr.length ? ` Judge on: ${criteriaArr.join('; ')}.` : '';
    const custom = format.desc ? ` Format details: ${format.desc}.` : '';
    send(`Let's run a ${format.name} round.${custom}${times}${crit} Set it up — give me the motion and my side, briefly explain the structure, then begin as my opponent.`);
  }

  async function saveRound() {
    if (isGuest) {
      alert('Log in to save rounds. Your trial round is not stored.');
      router.push('/login');
      return;
    }
    const { motion, side, scores } = parseRoundMeta(messages);
    const { error } = await supabase.from('rounds').insert({ transcript: messages, format: roundLabel(format), motion, side, scores });
    alert(error ? 'Save failed: ' + error.message : 'Round saved.');
  }

  return (
    <div className="portal">
      <div className="topbar">
        <span className="brand">Debate Practice</span>
        <span className="fmt neutral">{roundLabel(format)}</span>
        {isGuest && <span className="fmt guest">Trial</span>}
        <div className="toggle" title={speechSupported ? 'Switch input mode' : 'Voice needs a browser with speech support'}>
          <button className={mode === 'text' ? 'on' : ''} onClick={() => switchMode('text')}>Text</button>
          <button className={mode === 'voice' ? 'on' : ''} onClick={() => switchMode('voice')} disabled={!speechSupported}>Voice</button>
        </div>
        {!isGuest && <button className="btn btn-ghost" onClick={() => router.push('/history')}>History</button>}
        <button className="btn btn-ghost" onClick={() => router.push('/start')}>New round</button>
      </div>

      <div className="modebar">
        {!isDrill && MODES.map((m) => (
          <button key={m.key} className={`mode ${m.cls}`} onClick={() => send(m.key)} disabled={busy}>{m.label}</button>
        ))}
        <button className="mode" onClick={saveRound} disabled={busy || messages.length === 0} style={{ marginLeft: 'auto' }}>{isDrill ? 'Save drill' : 'Save round'}</button>
      </div>

      <div className="thread" ref={threadRef}>
        {messages.length === 0 && isDrill ? (
          <div className="empty">
            <h2>{format.name} drill</h2>
            <p>{format.intro}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={startRound} disabled={busy}>Start drill</button>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty briefing">
            <h2>{isImpromptu ? 'Impromptu round' : `${format.name} round`}</h2>
            <p>Here&rsquo;s how this round runs — change anything before you start.</p>
            <div className="brief">
              <div className="brief-block">
                <label>Speech times <span>· the timer counts these down</span></label>
                <textarea value={speechesText} onChange={(e) => setSpeechesText(e.target.value)}
                  rows={Math.min(8, speechesArr.length + 1)} spellCheck={false} />
              </div>
              <div className="brief-block">
                <label>Judging criteria <span>· the judge scores these</span></label>
                <textarea value={criteriaText} onChange={(e) => setCriteriaText(e.target.value)}
                  rows={Math.min(6, criteriaArr.length + 1)} spellCheck={false} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={startRound} disabled={busy}>Start round</button>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className="who">{m.role === 'user' ? 'You' : 'Opponent'}</div>
            {m.role === 'assistant'
              ? <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(stripMeta(m.content) || '…') }} />
              : m.content}
          </div>
        ))}
      </div>

      {mode === 'voice' && (
        <div className="voicebar">
          <button
            className={`talk ${listening ? 'live' : ''}`}
            onClick={() => startListening(true)}
            disabled={busy || !speechSupported}
          >
            {listening ? '● Recording — tap to finish & send' : '🎤 Deliver your speech'}
          </button>
          {!isDrill && (
            <div className="timer">
              {timers.length > 0 ? (
                <>
                  <select value={speechIdx} onChange={(e) => { setRunning(false); setSpeechIdx(Number(e.target.value)); }}>
                    {timers.map((t, i) => <option key={i} value={i}>{t.label} · {fmtClock(t.seconds)}</option>)}
                  </select>
                  <span className={`clock ${done ? 'done' : ''}`}>{done ? 'Time!' : fmtClock(remaining)}</span>
                  <button onClick={toggleTimer}>{running ? 'Pause' : 'Start'}</button>
                  <button onClick={resetTimer}>Reset</button>
                </>
              ) : (
                <span className="voicenote">Add speech times in the briefing to use the timer.</span>
              )}
            </div>
          )}
          {ttsSupported && messages.length > 0 && (
            <button className="replay" title="Replay last reply"
              onClick={() => { const last = [...messages].reverse().find((x) => x.role === 'assistant'); if (last) speak(last.content); }}>
              🔊 Replay
            </button>
          )}
        </div>
      )}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <div className="field-wrap">
          <textarea ref={taRef} value={input}
            onChange={(e) => { setInput(e.target.value); autosize(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(input); } }}
            placeholder="Write your speech here…  (⌘/Ctrl + Enter to send)" disabled={busy} />
          {words > 0 && (
            <span className="wordcount">{words} {words === 1 ? 'word' : 'words'} · ~{fmtClock(speakSecs)} at {wpm} wpm</span>
          )}
        </div>
        {speechSupported && (
          <button type="button" className={`iconbtn mic ${listening && mode === 'text' ? 'live' : ''}`}
            title="Dictate — speak instead of typing" aria-label="Dictate"
            onClick={() => startListening(false)} disabled={busy}>🎤</button>
        )}
        <button type="submit" className="btn btn-primary send" disabled={busy}>{busy ? '…' : 'Send'}</button>
      </form>
    </div>
  );
}
