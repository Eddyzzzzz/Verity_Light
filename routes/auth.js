const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { password } = req.body;
  const stored = process.env.ADMIN_PASSWORD || 'admin123';

  // Support both plain and hashed passwords in env
  const ok = stored.startsWith('$2')
    ? await bcrypt.compare(password, stored)
    : password === stored;

  if (!ok) return res.status(401).json({ error: 'Wrong password' });

  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
