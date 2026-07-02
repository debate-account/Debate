import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Handles the link from the confirmation email. Supabase redirects here after
// verifying the token; we finish establishing the session and then send the
// user to a friendly page — never a raw error page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const supabase = createClient();

  let ok = false;
  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      ok = !error;
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash });
      ok = !error;
    }
  } catch {
    ok = false;
  }

  return NextResponse.redirect(new URL(ok ? '/auth/confirmed' : '/auth/confirmed?error=1', url.origin));
}
