'use client';
import { useRouter } from 'next/navigation';

export default function StartScreen() {
  const router = useRouter();
  return (
    <div className="wrap">
      <div className="eyebrow">New round</div>
      <h1 className="h-hero">What kind of round?</h1>
      <p className="lead">Pick how you want to practice today.</p>
      <div className="choices">
        <button className="choice prep" onClick={() => router.push('/practice?format=prepared')}>
          <span className="edge" />
          <span className="tag">Prepared</span>
          <h3>Prepared round</h3>
          <p>You know the motion ahead of time. Build a case with contentions and real evidence, then defend it against a full opposing bench.</p>
          <div className="go">Start prepared &rarr;</div>
        </button>
        <button className="choice impromptu" onClick={() => router.push('/practice?format=impromptu')}>
          <span className="edge" />
          <span className="tag">Impromptu</span>
          <h3>Impromptu round</h3>
          <p>Get a surprise motion and a few minutes to prep. Think on your feet with claim, warrant, and impact — no evidence needed.</p>
          <div className="go">Start impromptu &rarr;</div>
        </button>
      </div>
    </div>
  );
}
