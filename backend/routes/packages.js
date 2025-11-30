// backend/routes/packages.js
module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // GET all packages
  router.get('/', (req, res) => {
    // NOTE: use `updated_at` (not updates_at)
    const sql = `
      SELECT package_id, name, description, duration_hour, price, created_at, updated_at
      FROM packages
      ORDER BY package_id ASC
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error('DB err GET /packages:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(rows);
    });
  });

  // GET single package
  router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
      SELECT package_id, name, description, duration_hour, price, created_at, updated_at
      FROM packages
      WHERE package_id = ?
      LIMIT 1
    `;
    db.query(sql, [id], (err, rows) => {
      if (err) {
        console.error('DB err GET /packages/:id:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (!rows.length) return res.status(404).json({ message: 'Not found' });
      res.json(rows[0]);
    });
  });

  // CREATE
  router.post('/', (req, res) => {
    // accept either duration_hour or duration (frontend convenience)
    const { name, description, duration_hour, duration, price } = req.body || {};
    const dur = duration_hour || duration;
    if (!name || !description || !dur || price == null) {
      return res.status(422).json({ message: 'Missing fields' });
    }

    const sql = 'INSERT INTO packages (name, description, duration_hour, price) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, description, dur, price], (err, result) => {
      if (err) {
        console.error('DB err POST /packages:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      // return the created resource id using package_id key
      return res.status(201).json({ package_id: result.insertId, message: 'Package created' });
    });
  });

  // UPDATE
  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { name, description, duration_hour, duration, price } = req.body || {};
    const dur = duration_hour || duration;
    if (!name || !description || !dur || price == null) {
      return res.status(422).json({ message: 'Missing fields' });
    }

    const sql = 'UPDATE packages SET name = ?, description = ?, duration_hour = ?, price = ? WHERE package_id = ?';
    db.query(sql, [name, description, dur, price, id], (err, result) => {
      if (err) {
        console.error('DB err PUT /packages/:id:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Package updated' });
    });
  });

  // DELETE
  router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM packages WHERE package_id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('DB err DELETE /packages/:id:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Package deleted' });
    });
  });

  return router;
};
