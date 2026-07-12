'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Create the client lazily on click (browser only). Constructing it during
  // render would run at build-time prerender and crash the whole build if the
  // NEXT_PUBLIC_SUPABASE_* vars aren't present for that environment.
  async function signIn() {
    if (busy) return; // failsafe: no double-submit / spamming
    if (!email.trim() || !password) { setMsg('Enter your email and password.'); return; }
    setMsg(''); setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (!error) { router.push('/start'); return; }
    if (/email not confirmed/i.test(error.message)) {
      setMsg('Almost there — confirm your email, then sign in. (Check your spam folder.)');
    } else if (/invalid login credentials/i.test(error.message)) {
      setMsg('Wrong email or password. New here? Tap Sign up.');
    } else {
      setMsg(error.message);
    }
  }

  async function signUp() {
    if (busy) return; // failsafe: no double-submit / spamming
    if (!email.trim() || !password) { setMsg('Enter an email and a password.'); return; }
    if (password.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    setMsg(''); setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      if (/already registered|already exists|already been registered/i.test(error.message)) {
        setMsg('That email already has an account — tap Sign in instead.');
      } else if (/rate|too many|for security|seconds/i.test(error.message)) {
        setMsg('Too many tries in a row — wait a minute, then try again.');
      } else {
        setMsg(error.message);
      }
      return;
    }
    // If email confirmation is OFF (recommended), Supabase returns a session and
    // the user is already signed in — go straight in. If confirmation is ON,
    // there's no session yet and they need to confirm by email first.
    if (data.session) { router.push('/start'); return; }
    setMsg('Account created — check your email to confirm, then come back and sign in.');
  }

  return (
    <div className="center">
      <div className="auth">
        <h1>Debate Practice</h1>
        <p className="sub">Spar with an AI opponent, then get judged and coached.</p>
        <input className="field" placeholder="Email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') signIn(); }} />
        <input className="field" type="password" placeholder="Password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') signIn(); }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={signIn} disabled={busy}>{busy ? '…' : 'Sign in'}</button>
          <button className="btn" onClick={signUp} disabled={busy}>{busy ? '…' : 'Sign up'}</button>
        </div>
        {msg && <p className="err">{msg}</p>}

        <button className="btn btn-ghost trial" onClick={() => router.push('/start')}>
          Skip — try without an account →
        </button>
        <p className="trial-note">Trial rounds work fully but aren’t saved.</p>
      </div>
    </div>
  );
}
