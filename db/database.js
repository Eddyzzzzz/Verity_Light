const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(path.join(dataDir, 'db.sqlite'));
db.exec('PRAGMA journal_mode=WAL');

function seed() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      material TEXT DEFAULT '',
      category TEXT DEFAULT 'all',
      description TEXT DEFAULT '',
      badge TEXT DEFAULT '',
      in_stock INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      square_payment_id TEXT,
      items TEXT,
      subtotal REAL,
      shipping REAL,
      discount REAL,
      total REAL,
      customer_name TEXT,
      customer_email TEXT,
      shipping_address TEXT,
      status TEXT DEFAULT 'paid',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const contentCount = db.prepare('SELECT COUNT(*) as c FROM content').get();
  if (parseInt(contentCount.c) === 0) {
    const ins = db.prepare('INSERT INTO content (key,value) VALUES (?,?)');
    [
      ['heroEyebrow', 'Artisan Studio · Est. 2009'],
      ['heroTitle', 'Jewelry born from |light| and |intention|'],
      ['heroDesc', 'Each VerityLights piece is shaped by hand — unhurried, intentional, and made to carry meaning. Wear something true.'],
      ['heroBtnPrimary', 'Explore Collection'],
      ['heroBtnSecondary', 'Our Craft'],
      ['shopLabel', 'Collections'],
      ['shopTitle', 'Pieces made with |patience|'],
      ['craftLabel', 'Bespoke Service'],
      ['craftTitle', 'Commission a piece |just for you|'],
      ['craftBody', 'Tell us your vision — a stone that carries meaning, a shape that feels like home.'],
      ['craftBtn', 'Start a Commission'],
      ['aboutLabel', 'Our Story'],
      ['aboutTitle', 'Rooted in craft, guided by |light|'],
      ['aboutP1', 'VerityLights was born in a small studio in 2009, when founder Mara Calloway began fashioning rings from reclaimed silver at her kitchen table. What started as a quiet practice grew into a community of wearers who believe jewelry should be true.'],
      ['aboutP2', 'We work slowly, by hand, with ethically sourced stones and recycled metals. Every piece leaves our studio with a story already inside it.'],
      ['stat1num', '15+'], ['stat1label', 'Years of craft'],
      ['stat2num', '4K+'], ['stat2label', 'Pieces made'],
      ['stat3num', '100%'], ['stat3label', 'Ethically sourced'],
      ['contactAddress', '88 Mill Street, Studio 4\nNorthampton, MA 01060'],
      ['contactHours', 'Tue–Sat: 10am – 5pm\nSunday: By appointment'],
      ['contactEmail', 'hello@veritylights.com'],
      ['contactPhone', '+1 (413) 555-0192'],
      ['brandMain', 'Verity'],
      ['brandItalic', 'Lights'],
      ['brandTagline', 'Handcrafted Jewelry'],
      ['footerAbout', 'Handcrafted jewelry made slowly, with intention. Ethically sourced, designed to last. Family studio since 2009.'],
      ['copyright', '© 2026 VerityLights. All rights reserved.'],
      ['colors', JSON.stringify({ink:'#1c1812',bark:'#3d3020',clay:'#7a5c3e',sand:'#c4a97d',warm:'#e8d5b5',parchment:'#f4ede0',cream:'#faf6ef',moss:'#4a5240',sage:'#8a9478'})]
    ].forEach(([k,v]) => ins.run(k, v));
  }

  const settingsCount = db.prepare('SELECT COUNT(*) as sc FROM settings').get();
  if (parseInt(settingsCount.sc) === 0) {
    const ins = db.prepare('INSERT INTO settings (key,value) VALUES (?,?)');
    ins.run('freeShippingThreshold', '120');
    ins.run('shippingCost', '12');
    ins.run('discountCodes', JSON.stringify([{ code: 'WELCOME10', percent: 10 }]));
  }

  const prodCount = db.prepare('SELECT COUNT(*) as pc FROM products').get();
  if (parseInt(prodCount.pc) === 0) {
    const ins = db.prepare('INSERT INTO products (name,price,material,category,badge,sort_order) VALUES (?,?,?,?,?,?)');
    [
      ['Solstice Ring', 195, 'Recycled Silver', 'rings', 'Bestseller', 1],
      ['Canopy Pendant', 385, '14k Gold & Citrine', 'necklaces', 'New', 2],
      ['Ember Bracelet', 265, 'Rose Gold Fill', 'bracelets', '', 3],
      ['Moss Stud Earrings', 125, 'Sterling & Peridot', 'earrings', 'Bestseller', 4],
      ['Rivulet Ring', 445, '14k Gold', 'rings', 'New', 5],
      ['Dusk Necklace', 295, 'Silver & Labradorite', 'necklaces', '', 6],
      ['Tidal Cuff', 155, 'Recycled Brass', 'bracelets', '', 7],
      ['Flicker Drops', 215, '18k Gold & Garnet', 'earrings', 'Limited', 8],
    ].forEach(p => ins.run(...p));
  }

  console.log('Database ready.');
}

module.exports = { db, uploadsDir, seed };
