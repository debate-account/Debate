import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';

export default async function Practice() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <Chat />;
}
