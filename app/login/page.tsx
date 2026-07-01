'use client';
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
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : 'Account created — now tap Sign in.');
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
      </div>
    </div>
  );
}
