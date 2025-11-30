// backend/routes/bookings.js
module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // helper - try to require reference generator if present
  let generateReferenceID = null;
  try {
    generateReferenceID = require('../utils/reference').generateReferenceID;
  } catch (e) {
    // ignore - we'll fallback to timestamp-based ref in create route
  }

  // GET /api/bookings  — list bookings (most recent first)
  router.get('/', (req, res) => {
    const sql = `
      SELECT bookingID, referenceID, firstName, lastName, phone, email, address, date, serviceName, package_id, status, created_at
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 2000
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error('DB err GET /bookings:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      return res.json(rows);
    });
  });

  // POST /api/bookings/create  — create a booking
  router.post('/create', (req, res) => {
    const { firstName, lastName, phone, email, address, date, serviceName, package_id } = req.body || {};

    if (!firstName || !lastName || !phone || !email || !date || !serviceName || !package_id) {
      return res.status(422).json({ message: 'Missing required fields' });
    }

    // generate reference ID (prefer utility if available)
    let referenceID;
    if (typeof generateReferenceID === 'function') {
      try { referenceID = generateReferenceID(); } catch (e) {}
    }
    if (!referenceID) {
      referenceID = 'BOOK-' + new Date().toISOString().replace(/[-:.TZ]/g, '') + '-' + Math.floor(Math.random() * 90000 + 10000);
    }

    const sql = `
      INSERT INTO bookings (referenceID, firstName, lastName, phone, email, address, date, serviceName, package_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [referenceID, firstName, lastName, phone, email, address || null, date, serviceName, package_id], (err, result) => {
      if (err) {
        console.error('DB err POST /bookings/create:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      return res.status(201).json({ bookingID: result.insertId, referenceID, message: 'Booking created' });
    });
  });

  // PUT /api/bookings/update/:id  — update booking (status only for now)
  router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    if (!status) return res.status(422).json({ message: 'Missing status' });

    const sql = 'UPDATE bookings SET status = ? WHERE bookingID = ?';
    db.query(sql, [status, id], (err, result) => {
      if (err) {
        console.error('DB err PUT /bookings/update:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Updated' });
    });
  });

  // DELETE /api/bookings/delete/:id
  router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM bookings WHERE bookingID = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('DB err DELETE /bookings/delete:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    });
  });

  return router;
};
