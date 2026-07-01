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
    if (error) setMsg(error.message); else router.push('/practice');
  }
  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : 'Account created. Confirm via email if required, then sign in.');
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 16 }}>
      <h1>Debate Practice</h1>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: 8, margin: '8px 0' }} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: 8, margin: '8px 0' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={signIn}>Sign in</button>
        <button onClick={signUp}>Sign up</button>
      </div>
      {msg && <p style={{ color: '#a00' }}>{msg}</p>}
    </div>
  );
}
