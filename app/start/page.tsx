import StartScreen from '@/components/StartScreen';
import { createClient } from '@/lib/supabase/server';
import type { CustomFormatRow, CustomDrillRow } from '@/lib/custom';

// Needs the request (cookies/auth) to know if the user is logged in and to load
// their saved customs, so it can't be statically prerendered.
export const dynamic = 'force-dynamic';

export default async function Start() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let customFormats: CustomFormatRow[] = [];
  let customDrills: CustomDrillRow[] = [];
  if (user) {
    // If the tables don't exist yet, these error quietly and we fall back to [].
    const [f, d] = await Promise.all([
      supabase.from('custom_formats').select('id, name, description').order('created_at', { ascending: false }),
      supabase.from('custom_drills').select('id, name, tag, blurb').order('created_at', { ascending: false }),
    ]);
    customFormats = (f.data as CustomFormatRow[]) || [];
    customDrills = (d.data as CustomDrillRow[]) || [];
  }

  return <StartScreen isLoggedIn={!!user} customFormats={customFormats} customDrills={customDrills} />;
}
