'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  // Create the client lazily on click (browser only). Constructing it during
  // render would run at build-time prerender and crash the whole build if the
  // NEXT_PUBLIC_SUPABASE_* vars aren't present for that environment.
  async function signIn() {
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message); else router.push('/start');
  }
  async function signUp() {
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setMsg(error ? error.message : 'Check your email to confirm your account.');
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

        <p className="auth-note">Use a real email — sign-up sends a confirmation link. Heads up: that link can fail in Safari; if it doesn’t open, try Chrome or Edge.</p>

        <button className="btn btn-ghost trial" onClick={() => router.push('/start')}>
          Skip — try without an account →
        </button>
        <p className="trial-note">Trial rounds work fully but aren’t saved.</p>
      </div>
    </div>
  );
}
