import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';

export default async function Practice({ searchParams }: { searchParams: { format?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const format = searchParams.format === 'impromptu' ? 'impromptu' : 'prepared';
  return <Chat format={format} />;
}
