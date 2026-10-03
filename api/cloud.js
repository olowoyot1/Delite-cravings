const crypto = require('crypto');

const TABLE = 'delite_cravings_state';
const ROW_ID = 'default';

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin || '')).digest('hex');
}

async function sb(path, options = {}) {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Supabase environment variables are not configured.');
  const res = await fetch(base + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.message || 'Supabase request failed'));
  return data;
}

function cleanState(data) {
  return {
    products: Array.isArray(data?.products) ? data.products : [],
    days: data?.days && typeof data.days === 'object' ? data.days : {},
    debtors: Array.isArray(data?.debtors) ? data.debtors : [],
    creditSales: Array.isArray(data?.creditSales) ? data.creditSales : [],
    payments: Array.isArray(data?.payments) ? data.payments : []
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const username = String(body.username || '').trim();
    const pin = String(body.pin || '');
    if (!username || !pin) return res.status(401).json({ error: 'Login required' });

    const rows = await sb(TABLE + '?id=eq.' + encodeURIComponent(ROW_ID) + '&select=id,data,updated_at');
    const row = Array.isArray(rows) && rows[0];

    if (body.action === 'pull') {
      if (!row) return res.status(200).json({ exists: false, data: null });
      const storedAuth = row.data?.auth || {};
      if (storedAuth.username !== username || storedAuth.pinHash !== hashPin(pin)) {
        return res.status(401).json({ error: 'Invalid username or PIN' });
      }
      return res.status(200).json({ exists: true, data: cleanState(row.data), updatedAt: row.updated_at });
    }

    if (body.action !== 'push') return res.status(400).json({ error: 'Unknown action' });

    if (row) {
      const storedAuth = row.data?.auth || {};
      if (storedAuth.username !== username || storedAuth.pinHash !== hashPin(pin)) {
        return res.status(401).json({ error: 'Cloud login does not match this account' });
      }
    }

    const state = cleanState(body);
    state.auth = { username, pinHash: hashPin(pin) };

    const saved = await sb(TABLE, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: ROW_ID, data: state, updated_at: new Date().toISOString() })
    });

    return res.status(200).json({ ok: true, updatedAt: saved?.[0]?.updated_at || new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Cloud storage error' });
  }
};
