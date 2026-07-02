import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { renderMarkdown, stripMeta, scoreTotal, type Scores } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

type Msg = { role: 'user' | 'assistant'; content: string };

export default async function RoundDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('rounds')
    .select('id, created_at, motion, side, format, transcript, scores')
    .eq('id', params.id)
    .single();
  if (!data) notFound();

  const transcript = (data.transcript || []) as Msg[];
  const scores = data.scores as Scores | null;
  const total = scoreTotal(scores);

  return (
    <div className="wrap">
      <Link className="btn btn-ghost" href="/history">← History</Link>
      <h1 className="h-hero" style={{ marginTop: 10 }}>{data.motion || 'Untitled round'}</h1>
      <p className="lead" style={{ marginBottom: 18 }}>
        {data.format === 'impromptu' ? 'Impromptu' : 'Prepared'}
        {data.side ? ` · ${data.side}` : ''} · {new Date(data.created_at).toLocaleString()}
      </p>

      {scores && (
        <div className="score-cards">
          <Score label="Content" v={scores.content} />
          <Score label="Style" v={scores.style} />
          <Score label="Strategy" v={scores.strategy} />
          {total != null && <Score label="Total" v={total} max={30} />}
        </div>
      )}

      <div className="transcript">
        {transcript.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className="who">{m.role === 'user' ? 'You' : 'Opponent'}</div>
            {m.role === 'assistant'
              ? <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(stripMeta(m.content)) }} />
              : m.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function Score({ label, v, max = 10 }: { label: string; v?: number; max?: number }) {
  return (
    <div className="score-card">
      <div className="score-val">{v ?? '—'}<span>/{max}</span></div>
      <div className="score-label">{label}</div>
    </div>
  );
}
