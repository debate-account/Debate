'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

export default function Chat({ format }: { format: 'prepared' | 'impromptu' }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function autosize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.42) + 'px';
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
        setMessages((m) => [...m, { role: 'assistant', content: '(Could not reach the opponent — check the API key in .env.local.)' }]);
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
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '(Something went wrong.)' }]);
    }
    setBusy(false);
  }

  function startRound() {
    send(format === 'impromptu'
      ? 'IMPROMPTU'
      : "Let's run a prepared round. Ask me your setup questions — the motion, my side, and team size — then wait for me to begin.");
  }

  async function saveRound() {
    const { error } = await supabase.from('rounds').insert({ transcript: messages, format });
    alert(error ? 'Save failed: ' + error.message : 'Round saved.');
  }

  return (
    <div className="portal">
      <div className="topbar">
        <span className="brand">Debate Practice</span>
        <span className={`fmt ${format}`}>{format === 'impromptu' ? 'Impromptu' : 'Prepared'}</span>
        <div className="toggle" title="Voice mode is coming soon">
          <button className="on">Text</button>
          <button disabled>Voice</button>
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

      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea ref={taRef} value={input}
          onChange={(e) => { setInput(e.target.value); autosize(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(input); } }}
          placeholder="Write your speech here…  (⌘/Ctrl + Enter to send)" disabled={busy} />
        <button type="submit" className="btn btn-primary send" disabled={busy}>{busy ? '…' : 'Send'}</button>
      </form>
    </div>
  );
}
