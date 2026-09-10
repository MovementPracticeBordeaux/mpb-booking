import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.movementpracticebordeaux.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pagesFixes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/tarifs`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/planning`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/coaching`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/mentorat`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/evenements`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/defi`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/quiz`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE}/mentions-legales`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE}/cgv`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE}/confidentialite`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  // Événements actifs à venir : chacun a sa propre page publique, autant
  // qu'ils soient découvrables par Google eux aussi.
  const admin = supabaseAdmin();
  const { data: evenements } = await admin
    .from('evenements')
    .select('id, date_debut')
    .eq('actif', true)
    .gte('date_fin', new Date().toISOString());

  const pagesEvenements: MetadataRoute.Sitemap = (evenements ?? []).map((e) => ({
    url: `${BASE}/evenements/${e.id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...pagesFixes, ...pagesEvenements];
}
