import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';
import { findFormat, type RoundFormat } from '@/lib/formats';

export default async function Practice({
  searchParams,
}: {
  searchParams: { format?: string; mode?: string; desc?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No login gate: guests can run an unsaved trial round. Saving is gated in Chat.
  const def = findFormat(searchParams.format);
  const id = def?.id || 'nydl';
  const format: RoundFormat = {
    id,
    name: def?.name || 'NYDL / ESU',
    mode: id === 'nydl' ? (searchParams.mode === 'impromptu' ? 'impromptu' : 'prepared') : undefined,
    desc: id === 'other' ? searchParams.desc : undefined,
    speeches: def?.speeches || [],
  };
  return <Chat format={format} isGuest={!user} />;
}
