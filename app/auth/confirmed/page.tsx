import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Friendly landing after the confirmation-email link is clicked.
export default function Confirmed({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error === '1';
  return (
    <div className="center">
      <div className="auth" style={{ textAlign: 'center' }}>
        <h1>{error ? 'Almost there' : 'Email confirmed ✓'}</h1>
        <p className="sub">
          {error
            ? "We couldn't finish confirming automatically — no problem, just head back and sign in with the email and password you used."
            : 'Your email is verified. Head back and sign in to start practicing.'}
        </p>
        <Link className="btn btn-primary" href="/login" style={{ display: 'inline-block', marginTop: 8 }}>
          Go to sign in →
        </Link>
      </div>
    </div>
  );
}
