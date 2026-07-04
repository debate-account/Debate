import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Chat from '@/components/Chat';
import { findFormat, criteriaFor, DEFAULT_SPEECHES, DEFAULT_CRITERIA, type RoundFormat } from '@/lib/formats';
import { findDrill } from '@/lib/drills';
import { splitLines, customDrillBrief, customDrillKickoff, type CustomFormatRow, type CustomDrillRow } from '@/lib/custom';

export default async function Practice({
  searchParams,
}: {
  searchParams: { format?: string; mode?: string; desc?: string; drill?: string; customFormat?: string; customDrill?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Custom drill saved by this user (RLS ensures they can only load their own).
  if (searchParams.customDrill && user) {
    const { data } = await supabase
      .from('custom_drills')
      .select('id, name, tag, blurb, instructions')
      .eq('id', searchParams.customDrill)
      .single();
    const d = data as CustomDrillRow | null;
    if (d) {
      const format: RoundFormat = {
        id: 'custom-drill', name: d.name, drill: true,
        brief: customDrillBrief(d), kickoff: customDrillKickoff(d),
        intro: d.blurb || 'Your custom drill.', speeches: [], criteria: [],
      };
      return <Chat format={format} isGuest={false} />;
    }
  }

  // Custom round format saved by this user → runs through the "other / custom" path.
  if (searchParams.customFormat && user) {
    const { data } = await supabase
      .from('custom_formats')
      .select('id, name, description, speeches, criteria')
      .eq('id', searchParams.customFormat)
      .single();
    const f = data as CustomFormatRow | null;
    if (f) {
      const speeches = splitLines(f.speeches);
      const criteria = splitLines(f.criteria);
      const format: RoundFormat = {
        id: 'other', name: f.name,
        desc: f.description || undefined,
        speeches: speeches.length ? speeches : DEFAULT_SPEECHES,
        criteria: criteria.length ? criteria : DEFAULT_CRITERIA,
      };
      return <Chat format={format} isGuest={false} />;
    }
  }

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

  // Custom formats are logged-in only — block guests from reaching one directly
  // by URL (?format=other), which would let them stretch the trial.
  if (searchParams.format === 'other' && !user) redirect('/login');

  // No login gate on the standard formats: guests can run an unsaved trial round.
  // Saving is gated in Chat.
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
