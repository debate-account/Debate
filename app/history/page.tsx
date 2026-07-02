import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { scoreTotal, type Scores } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

type Round = {
  id: string;
  created_at: string;
  motion: string | null;
  side: string | null;
  format: string | null;
  scores: Scores | null;
};

export default async function History() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('rounds')
    .select('id, created_at, motion, side, format, scores')
    .order('created_at', { ascending: false });
  const rounds = (data || []) as Round[];

  // Chronological score totals for the progress chart.
  const totals = [...rounds].reverse()
    .map((r) => scoreTotal(r.scores))
    .filter((n): n is number => n != null);

  return (
    <div className="wrap">
      <div className="history-head">
        <div>
          <div className="eyebrow">Your practice</div>
          <h1 className="h-hero">History</h1>
        </div>
        <Link className="btn" href="/start">New round →</Link>
      </div>

      {totals.length >= 2 && <Progress totals={totals} />}

      {rounds.length === 0 ? (
        <p className="lead">No saved rounds yet. Finish a round and tap “Save round.”</p>
      ) : (
        <ul className="round-list">
          {rounds.map((r) => {
            const total = scoreTotal(r.scores);
            return (
              <li key={r.id}>
                <Link href={`/history/${r.id}`} className="round-card">
                  <div className="round-main">
                    <span className={`fmt ${r.format || ''}`}>{r.format === 'impromptu' ? 'Impromptu' : 'Prepared'}</span>
                    <span className="round-motion">{r.motion || 'Untitled round'}</span>
                  </div>
                  <div className="round-meta">
                    {r.side && <span>{r.side}</span>}
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {total != null && <span className="round-score">{total}/30</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Simple dependency-free bar chart of total score (out of 30) over time.
function Progress({ totals }: { totals: number[] }) {
  const W = 340, H = 96, MAX = 30, n = totals.length;
  const slot = (W - 8) / n;
  const bw = Math.min(30, slot - 6);
  return (
    <div className="progress">
      <div className="progress-title">Total score over time <em>(out of 30, per saved round)</em></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="progress-svg" role="img" aria-label="Score progress by round">
        {totals.map((t, i) => {
          const h = Math.max(2, (t / MAX) * (H - 22));
          const x = 4 + i * slot + (slot - bw) / 2;
          return (
            <g key={i}>
              <rect x={x} y={H - h - 16} width={bw} height={h} rx={3} className="bar" />
              <text x={x + bw / 2} y={H - 4} className="bar-label">{t}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
