import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StartScreen from '@/components/StartScreen';

export default async function Start() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <StartScreen />;
}
