require('dotenv').config();
const express = require('express');
const path = require('path');
const { uploadsDir, seed } = require('./db/database');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images
app.use('/uploads', express.static(uploadsDir));

// Serve the storefront and admin panel
app.use(express.static(path.join(__dirname, 'public')));

// Public config for frontend (no secrets)
app.get('/api/config', (req, res) => {
  res.json({
    squareAppId: process.env.SQUARE_APPLICATION_ID || '',
    squareLocationId: process.env.SQUARE_LOCATION_ID || '',
    squareEnv: process.env.SQUARE_ENVIRONMENT || 'sandbox'
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/content', require('./routes/content'));
app.use('/api/orders', require('./routes/orders'));

// SPA fallback — admin panel
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));

// SPA fallback — storefront
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

try { seed(); } catch(err) { console.error('Database init failed:', err); process.exit(1); }

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VerityLights running on http://localhost:${PORT}`));
