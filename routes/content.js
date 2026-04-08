const router = require('express').Router();
const { db } = require('../db/database');
const requireAdmin = require('../middleware/auth');

// GET all content (public)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key,value FROM content').all();
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    res.json(obj);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update content (admin)
router.put('/', requireAdmin, (req, res) => {
  try {
    const upsert = db.prepare('INSERT INTO content (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    for (const [k, v] of Object.entries(req.body)) upsert.run(k, String(v));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET all settings (admin)
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT key,value FROM settings').all();
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    res.json(obj);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update settings (admin)
router.put('/settings', requireAdmin, (req, res) => {
  try {
    const upsert = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    for (const [k, v] of Object.entries(req.body)) upsert.run(k, String(v));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET public settings for storefront
router.get('/public-settings', (req, res) => {
  try {
    const obj = {};
    for (const k of ['freeShippingThreshold', 'shippingCost']) {
      const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k);
      if (r) obj[k] = r.value;
    }
    res.json(obj);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
