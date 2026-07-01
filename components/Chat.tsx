'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const MODES = [
  { key: 'OPPONENT', label: 'Opponent' },
  { key: 'JUDGE', label: 'Judge' },
  { key: 'COACH', label: 'Coach' },
  { key: 'IMPROMPTU', label: 'Impromptu' },
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: next }),
    });
    if (!res.ok || !res.body) { setBusy(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '';
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: 'assistant', content: acc };
        return copy;
      });
    }
    setBusy(false);
  }

  async function saveRound() {
    const { error } = await supabase.from('rounds').insert({ transcript: messages });
    alert(error ? 'Save failed: ' + error.message : 'Round saved.');
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {MODES.map((mo) => (
          <button key={mo.key} onClick={() => send(mo.key)} disabled={busy}>{mo.label}</button>
        ))}
        <button disabled title="Coming soon — voice input mode">Voice (soon)</button>
        <button onClick={saveRound} disabled={busy || messages.length === 0}>Save round</button>
      </div>

      <div style={{ minHeight: 320, border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#fff' }}>
        {messages.length === 0 && <p style={{ color: '#888' }}>Start a round — type a message or pick a mode.</p>}
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '10px 0' }}>
            <b>{m.role === 'user' ? 'You' : 'Opponent'}:</b>{' '}
            <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your speech..."
          style={{ flex: 1, padding: 10 }} disabled={busy} />
        <button type="submit" disabled={busy}>{busy ? '...' : 'Send'}</button>
      </form>
    </div>
  );
}
