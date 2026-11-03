// Configure these values in config.js after creating your Supabase project.
// The app stays usable with local storage until the connection is configured.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const ready = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('SEU-PROJETO');
const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

export const supabaseReady = Boolean(ready);

export async function readCloud() {
  if (!ready) return null;
  try {
    const [partners, events] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/parcerias?select=*&order=created_at.desc`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/eventos?select=*&order=data.asc`, { headers })
    ]);
    if (!partners.ok || !events.ok) throw new Error('Não foi possível ler os dados do Supabase.');
    return { partnerships: await partners.json(), events: await events.json() };
  } catch (error) { console.warn('Supabase indisponível; usando os dados deste navegador.', error); return null; }
}

export async function saveCloud(table, row) {
  if (!ready) return;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
  if (!response.ok) throw new Error('Não foi possível salvar no Supabase. Confira a configuração e as permissões.');
}
