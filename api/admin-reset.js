// Function serverless (roda só no servidor da Vercel, nunca no navegador).
// Único jeito seguro de apagar checkin_events: usa a service_role key, que
// fica só nas env vars do servidor — nunca é enviada ao cliente.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const { password } = req.body || {};
  const expected = process.env.ADMIN_RESET_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expected || !supabaseUrl || !serviceKey) {
    res.status(500).json({ error: 'Configuração ausente no servidor' });
    return;
  }
  if (!password || password !== expected) {
    res.status(401).json({ error: 'Senha incorreta' });
    return;
  }

  const r = await fetch(`${supabaseUrl}/rest/v1/checkin_events?event_code=eq.TEPEQUEM2026`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=minimal',
    },
  });

  if (!r.ok) {
    const detail = await r.text();
    res.status(502).json({ error: 'Falha ao apagar no Supabase', detail });
    return;
  }

  res.status(200).json({ ok: true });
}
