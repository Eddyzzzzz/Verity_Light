const router = require('express').Router();
const { Client, Environment } = require('square');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const requireAdmin = require('../middleware/auth');

function getSquareClient() {
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
    environment: process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox
  });
}

// POST /api/orders/pay
router.post('/pay', async (req, res) => {
  const { sourceId, items, subtotal, shipping, discount, total, customerName, customerEmail, shippingAddress } = req.body;

  if (!sourceId || !items || total == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const amountCents = Math.round(parseFloat(total) * 100);
  if (amountCents < 100) return res.status(400).json({ error: 'Order total too low' });

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return res.status(503).json({ error: 'Payment system not configured. Please add your Square credentials in the .env file.' });
  }

  try {
    const client = getSquareClient();
    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: uuidv4(),
      amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
      locationId: process.env.SQUARE_LOCATION_ID || '',
      buyerEmailAddress: customerEmail || undefined,
      note: `VerityLights — ${customerName || 'Customer'}`
    });

    const paymentId = result.payment.id;
    db.prepare(
      'INSERT INTO orders (square_payment_id,items,subtotal,shipping,discount,total,customer_name,customer_email,shipping_address,status) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(paymentId, JSON.stringify(items), parseFloat(subtotal)||0, parseFloat(shipping)||0, parseFloat(discount)||0, parseFloat(total), customerName||'', customerEmail||'', JSON.stringify(shippingAddress||{}), 'paid');

    res.json({ ok: true, paymentId });
  } catch (err) {
    console.error('Square payment error:', err);
    const msg = err?.errors?.[0]?.detail || err?.message || 'Payment failed';
    res.status(402).json({ error: msg });
  }
});

// POST /api/orders/validate-discount
router.post('/validate-discount', (req, res) => {
  try {
    const { code } = req.body;
    const row = db.prepare("SELECT value FROM settings WHERE key='discountCodes'").get();
    if (!row) return res.json({ valid: false });
    const codes = JSON.parse(row.value || '[]');
    const match = codes.find(c => c.code.toUpperCase() === (code || '').toUpperCase());
    if (match) res.json({ valid: true, percent: match.percent, code: match.code });
    else res.json({ valid: false });
  } catch(e) { res.json({ valid: false }); }
});

// GET /api/orders (admin)
router.get('/', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items||'[]'), shipping_address: JSON.parse(r.shipping_address||'{}') })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
