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

  // PUT /api/bookings/update/:id  — update booking (accepts multiple fields)
  router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Accept either nested booking or top-level fields
    const src = body.booking && typeof body.booking === 'object' ? body.booking : body;

    // Map potential input names to DB columns (adapt to your DB column names)
    // NOTE: your DB columns per other queries are camelCase like `firstName`, `serviceName`, etc.
    const fieldMap = {
      firstName: 'firstName',
      first_name: 'firstName',
      lastName: 'lastName',
      last_name: 'lastName',
      phone: 'phone',
      client_phone: 'phone',
      email: 'email',
      client_email: 'email',
      address: 'address',
      date: 'date',
      appointment_date: 'date',
      serviceName: 'serviceName',
      service_name: 'serviceName',
      package_id: 'package_id',
      status: 'status'
    };

    // Build dynamic SET clause
    const updates = [];
    const params = [];
    for (const key of Object.keys(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(src, key)) {
        const val = src[key];
        // treat empty string as "no change" — omit it to prevent accidental overwrite
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          updates.push(`${fieldMap[key]} = ?`);
          params.push(val);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    // bookingID is the PK used elsewhere in your code
    params.push(id);
    const sql = `UPDATE bookings SET ${updates.join(', ')} WHERE bookingID = ?`;

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('DB err PUT /bookings/update:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Not found' });
      }

      // Return the updated row so frontend can update UI without re-fetching
      db.query(
        'SELECT bookingID, referenceID, firstName, lastName, phone, email, address, date, serviceName, package_id, status, created_at FROM bookings WHERE bookingID = ?',
        [id],
        (err2, rows) => {
          if (err2) {
            console.error('DB err fetch updated row:', err2);
            return res.status(500).json({ message: 'Database error', error: err2.message });
          }
          // rows[0] should contain the updated row
          return res.json({ booking: rows[0] });
        }
      );
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
//test