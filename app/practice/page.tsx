import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';

export default async function Practice({ searchParams }: { searchParams: { format?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // No login gate: guests can run an unsaved trial round. Saving is gated in Chat.
  const format = searchParams.format === 'impromptu' ? 'impromptu' : 'prepared';
  return <Chat format={format} isGuest={!user} />;
}
