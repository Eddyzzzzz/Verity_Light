const router = require('express').Router();
const { db, uploadsDir } = require('../db/database');
const requireAdmin = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET all products (public)
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category && category !== 'all') {
      rows = db.prepare('SELECT * FROM products WHERE in_stock=1 AND category=? ORDER BY sort_order,id').all(category);
    } else {
      rows = db.prepare('SELECT * FROM products WHERE in_stock=1 ORDER BY sort_order,id').all();
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET all products including out-of-stock (admin)
router.get('/admin/all', requireAdmin, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM products ORDER BY sort_order,id').all());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET single product (public)
router.get('/:id', (req, res) => {
  try {
    const p = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST new product (admin)
router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { name, price, material, category, badge, description, in_stock, sort_order } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : '';
    const result = db.prepare(
      'INSERT INTO products (name,price,material,category,badge,description,in_stock,sort_order,image_url) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(name, parseFloat(price)||0, material||'', category||'rings', badge||'', description||'', parseInt(in_stock)??1, parseInt(sort_order)||0, image_url);
    res.json({ id: result.lastInsertRowid });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT update product (admin)
router.put('/:id', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, price, material, category, badge, description, in_stock, sort_order } = req.body;
    let image_url = existing.image_url;
    if (req.file) {
      if (image_url && image_url.startsWith('/uploads/')) {
        const oldPath = path.join(uploadsDir, path.basename(image_url));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = `/uploads/${req.file.filename}`;
    }
    db.prepare(
      'UPDATE products SET name=?,price=?,material=?,category=?,badge=?,description=?,in_stock=?,sort_order=?,image_url=? WHERE id=?'
    ).run(name||existing.name, parseFloat(price)||existing.price, material??existing.material, category||existing.category, badge??existing.badge, description??existing.description, parseInt(in_stock)??existing.in_stock, parseInt(sort_order)??existing.sort_order, image_url, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE product (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const p = db.prepare('SELECT image_url FROM products WHERE id=?').get(req.params.id);
    if (p?.image_url?.startsWith('/uploads/')) {
      const fp = path.join(uploadsDir, path.basename(p.image_url));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
