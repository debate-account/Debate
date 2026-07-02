'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message); else router.push('/start');
  }
  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMsg(error ? error.message : 'Check your email for a confirmation link, then come back and sign in.');
  }

  return (
    <div className="center">
      <div className="auth">
        <h1>Debate Practice</h1>
        <p className="sub">Spar with an AI opponent, then get judged and coached.</p>
        <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={signIn}>Sign in</button>
          <button className="btn" onClick={signUp}>Sign up</button>
        </div>
        {msg && <p className="err">{msg}</p>}

        <ol className="howto">
          <li>Enter a <strong>real email</strong> and a password, then click <strong>Sign up</strong>.</li>
          <li>Open the confirmation email we send and click the link — it lands on a “confirmed” page.</li>
          <li>Come back here and click <strong>Sign in</strong> with the same email and password.</li>
        </ol>

        <button className="btn btn-ghost trial" onClick={() => router.push('/start')}>
          Skip — try without an account →
        </button>
        <p className="trial-note">Trial rounds work fully but aren’t saved.</p>
      </div>
    </div>
  );
}
