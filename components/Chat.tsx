'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/components/Settings';

type Msg = { role: 'user' | 'assistant'; content: string };
const MODES = [
  { key: 'OPPONENT', label: 'Opponent', cls: '' },
  { key: 'JUDGE', label: 'Judge', cls: 'judge' },
  { key: 'COACH', label: 'Coach', cls: 'coach' },
];

// Minimal, safe Markdown -> HTML for the opponent/judge/coach replies.
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inline(s: string) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function renderMarkdown(src: string) {
  const lines = escapeHtml(src).split('\n');
  let html = '';
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (h) { closeList(); const lvl = Math.min(h[1].length + 2, 5); html += `<h${lvl}>${inline(h[2])}</h${lvl}>`; }
    else if (ul) { if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(ul[1])}</li>`; }
    else if (ol) { if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(ol[1])}</li>`; }
    else if (line === '') { closeList(); }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  closeList();
  return html;
}

// Strip markdown symbols so the AI voice reads clean prose.
function toSpeech(s: string) {
  return s.replace(/[#*_`>]/g, ' ').replace(/^\s*[-]\s+/gm, ' ').replace(/\s+/g, ' ').trim();
}
function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Chat({ format, isGuest }: { format: 'prepared' | 'impromptu'; isGuest: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [listening, setListening] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const { voiceURI, volume } = useSettings();
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);
  const baseTextRef = useRef('');

  // Detect browser capabilities after mount so the first client render matches
  // the server (both "unsupported"), avoiding a hydration mismatch.
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  useEffect(() => {
    setSpeechSupported(('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
    setTtsSupported('speechSynthesis' in window);
  }, []);

  const words = useMemo(() => (input.trim() ? input.trim().split(/\s+/).length : 0), [input]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Speech timer tick.
  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  // Stop any audio/recognition when unmounting.
  useEffect(() => () => {
    try { recRef.current?.stop(); } catch {}
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

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
        body: JSON.stringify({ messages: next }),
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
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: acc }; return c; });
      }
      if (mode === 'voice' && acc) speak(acc);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '(Something went wrong.)' }]);
    }
    setBusy(false);
  }

  // Web Speech recognition. autoSend=true sends the transcript on stop (voice mode);
  // autoSend=false dictates into the composer (accessibility for typing).
  function startListening(autoSend: boolean) {
    if (!speechSupported) return;
    if (listening) { try { recRef.current?.stop(); } catch {} return; }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.continuous = !autoSend;
    r.interimResults = true;
    r.lang = 'en-US';
    recRef.current = r;
    baseTextRef.current = autoSend ? '' : (input ? input + ' ' : '');
    let latest = '';
    r.onresult = (e: any) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      latest = txt;
      if (!autoSend) { setInput(baseTextRef.current + txt); requestAnimationFrame(autosize); }
    };
    r.onerror = () => setListening(false);
    r.onend = () => {
      setListening(false);
      if (autoSend && latest.trim()) send(latest.trim());
    };
    try { r.start(); setListening(true); } catch {}
  }

  function switchMode(m: 'text' | 'voice') {
    if (m === mode) return;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    if (ttsSupported) window.speechSynthesis.cancel();
    setMode(m);
  }

  function startRound() {
    send(format === 'impromptu'
      ? 'IMPROMPTU'
      : "Let's run a prepared round. Ask me your setup questions — the motion, my side, and team size — then wait for me to begin.");
  }

  async function saveRound() {
    if (isGuest) {
      alert('Log in to save rounds. Your trial round is not stored.');
      router.push('/login');
      return;
    }
    const { error } = await supabase.from('rounds').insert({ transcript: messages, format });
    alert(error ? 'Save failed: ' + error.message : 'Round saved.');
  }

  return (
    <div className="portal">
      <div className="topbar">
        <span className="brand">Debate Practice</span>
        <span className={`fmt ${format}`}>{format === 'impromptu' ? 'Impromptu' : 'Prepared'}</span>
        {isGuest && <span className="fmt guest">Trial</span>}
        <div className="toggle" title={speechSupported ? 'Switch input mode' : 'Voice needs a browser with speech support'}>
          <button className={mode === 'text' ? 'on' : ''} onClick={() => switchMode('text')}>Text</button>
          <button className={mode === 'voice' ? 'on' : ''} onClick={() => switchMode('voice')} disabled={!speechSupported}>Voice</button>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/start')}>New round</button>
      </div>

      <div className="modebar">
        {MODES.map((m) => (
          <button key={m.key} className={`mode ${m.cls}`} onClick={() => send(m.key)} disabled={busy}>{m.label}</button>
        ))}
        <button className="mode" onClick={saveRound} disabled={busy || messages.length === 0} style={{ marginLeft: 'auto' }}>Save round</button>
      </div>

      <div className="thread" ref={threadRef}>
        {messages.length === 0 ? (
          <div className="empty">
            <h2>{format === 'impromptu' ? 'Ready for a surprise motion?' : 'Ready when you are.'}</h2>
            <p>{format === 'impromptu'
              ? 'Tap start and your opponent hands you a motion and your side.'
              : 'Tap start and your opponent sets up the round with you.'}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={startRound} disabled={busy}>Start round</button>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className="who">{m.role === 'user' ? 'You' : 'Opponent'}</div>
            {m.role === 'assistant'
              ? <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content || '…') }} />
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
            {listening ? '● Listening… tap to stop' : '🎤 Tap to speak'}
          </button>
          <div className="timer">
            <span className="clock">{fmtClock(timer)}</span>
            <button onClick={() => setTimerOn((o) => !o)}>{timerOn ? 'Pause' : 'Start'}</button>
            <button onClick={() => { setTimerOn(false); setTimer(0); }}>Reset</button>
          </div>
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
          {words > 0 && <span className="wordcount">{words} {words === 1 ? 'word' : 'words'}</span>}
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
