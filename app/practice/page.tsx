import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';
import { findFormat, criteriaFor, type RoundFormat } from '@/lib/formats';
import { findDrill } from '@/lib/drills';

export default async function Practice({
  searchParams,
}: {
  searchParams: { format?: string; mode?: string; desc?: string; drill?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Skill drill: no opponent, just scenario → response → coaching.
  const drill = searchParams.drill ? findDrill(searchParams.drill) : undefined;
  if (drill) {
    const format: RoundFormat = {
      id: drill.id, name: drill.name, drill: true,
      brief: drill.brief, kickoff: drill.kickoff, intro: drill.blurb,
      speeches: [], criteria: [],
    };
    return <Chat format={format} isGuest={!user} />;
  }

  // No login gate: guests can run an unsaved trial round. Saving is gated in Chat.
  const def = findFormat(searchParams.format);
  const id = def?.id || 'nydl';
  const format: RoundFormat = {
    id,
    name: def?.name || 'NYDL / ESU',
    mode: id === 'nydl' ? (searchParams.mode === 'impromptu' ? 'impromptu' : 'prepared') : undefined,
    desc: id === 'other' ? searchParams.desc : undefined,
    speeches: def?.speeches || [],
    criteria: criteriaFor(id),
    progressiveArgs: def?.progressiveArgs,
  };
  return <Chat format={format} isGuest={!user} />;
}
