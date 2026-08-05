import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Reçoit le lien de connexion par email (?code=...), échange ce code contre
// une vraie session utilisateur, puis redirige vers l'accueil.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', req.url));
}
