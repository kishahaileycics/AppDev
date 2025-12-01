// backend/routes/bookings.js
module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Helper: split datetime into DATE + TIME
  function splitDateTime(value) {
    if (!value) return { booking_date: null, appointment_time: null };

    let s = String(value).trim().replace('T', ' ');
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return { booking_date: s, appointment_time: '00:00:00' };
    }
    // YYYY-MM-DD HH:MM or YYYY-MM-DD HH:MM:SS
    const parts = s.split(' ');
    if (parts.length === 2) {
      let [datePart, timePart] = parts;
      if (/^\d{2}:\d{2}$/.test(timePart)) timePart += ':00';
      if (!/^\d{2}:\d{2}:\d{2}$/.test(timePart)) timePart = '00:00:00';
      return { booking_date: datePart, appointment_time: timePart };
    }
    // HH:MM or HH:MM:SS only
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      let t = s;
      if (/^\d{2}:\d{2}$/.test(t)) t += ':00';
      return { booking_date: null, appointment_time: t };
    }
    return { booking_date: null, appointment_time: null };
  }

  // GET /api/bookings
  router.get('/', (req, res) => {
    const sql = `
      SELECT
        a.appointment_id AS bookingID,
        a.appointment_id AS referenceID,
        c.first_name AS firstName,
        c.last_name AS lastName,
        c.phone,
        c.email,
        c.address,
        a.booking_date,
        a.appointment_time,
        CONCAT(
          COALESCE(a.booking_date, ''),
          CASE WHEN a.appointment_time IS NOT NULL
               THEN CONCAT(' ', a.appointment_time)
               ELSE ''
          END
        ) AS date,
        p.package_id,
        p.package_name AS serviceName,
        a.staff_id
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.client_id
      LEFT JOIN packages p ON a.package_id = p.package_id
      ORDER BY a.appointment_id DESC
      LIMIT 2000
    `;
    db.query(sql, (err, rows) => {
      if (err) {
        console.error('DB err GET /bookings:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(rows);
    });
  });

  // POST /api/bookings/create
  router.post('/create', (req, res) => {
    const body = req.body || {};
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      date,
      booking_date: dateOnly,
      appointment_time: timeOnly,
      serviceName,
      package_id,
      staff_id
    } = body;

    if (!firstName || !lastName || !phone || !email || !(date || dateOnly || timeOnly) || !package_id) {
      return res.status(422).json({ message: 'Missing required fields' });
    }

    const { booking_date, appointment_time } = splitDateTime(
      date || `${dateOnly || ''} ${timeOnly || ''}`
    );

    const findClientSql = `SELECT client_id FROM clients WHERE email = ? OR phone = ? LIMIT 1`;
    db.query(findClientSql, [email, phone], (err, found) => {
      if (err) {
        console.error('DB err finding client:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      const insertAppointment = (clientId) => {
        const insertSql = `
          INSERT INTO appointments (client_id, package_id, booking_date, appointment_time, staff_id)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.query(
          insertSql,
          [clientId, package_id, booking_date, appointment_time, staff_id || null],
          (err2, result2) => {
            if (err2) {
              console.error('DB err insert appointment:', err2);
              return res.status(500).json({ message: 'Database error', error: err2.message });
            }
            const appointmentId = result2.insertId;
            // appointment_id is both bookingID + referenceID
            return res
              .status(201)
              .json({ bookingID: appointmentId, referenceID: appointmentId, message: 'Booking created' });
          }
        );
      };

      if (found && found.length) {
        const clientId = found[0].client_id;
        return insertAppointment(clientId);
      }

      const insertClientSql = `
        INSERT INTO clients (first_name, last_name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(
        insertClientSql,
        [firstName, lastName, phone, email, address || null],
        (err3, result3) => {
          if (err3) {
            console.error('DB err insert client:', err3);
            return res.status(500).json({ message: 'Database error', error: err3.message });
          }
          const newClientId = result3.insertId;
          return insertAppointment(newClientId);
        }
      );
    });
  });

  // PUT /api/bookings/update/:id
  router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const src = body.booking && typeof body.booking === 'object' ? body.booking : body;

    const clientFields = [];
    const clientParams = [];
    if (src.firstName !== undefined) { clientFields.push('first_name = ?'); clientParams.push(src.firstName); }
    if (src.lastName  !== undefined) { clientFields.push('last_name = ?');  clientParams.push(src.lastName); }
    if (src.phone     !== undefined) { clientFields.push('phone = ?');       clientParams.push(src.phone); }
    if (src.email     !== undefined) { clientFields.push('email = ?');       clientParams.push(src.email); }
    if (src.address   !== undefined) { clientFields.push('address = ?');     clientParams.push(src.address); }

    const apptFields = [];
    const apptParams = [];
    if (src.package_id !== undefined) { apptFields.push('package_id = ?'); apptParams.push(src.package_id); }

    if (src.date !== undefined) {
      const parts = splitDateTime(src.date);
      if (parts.booking_date !== null) { apptFields.push('booking_date = ?'); apptParams.push(parts.booking_date); }
      if (parts.appointment_time !== null) { apptFields.push('appointment_time = ?'); apptParams.push(parts.appointment_time); }
    } else {
      if (src.booking_date !== undefined) { apptFields.push('booking_date = ?'); apptParams.push(src.booking_date); }
      if (src.appointment_time !== undefined) { apptFields.push('appointment_time = ?'); apptParams.push(src.appointment_time); }
    }

    if (src.staff_id !== undefined) { apptFields.push('staff_id = ?'); apptParams.push(src.staff_id); }

    if (clientFields.length === 0 && apptFields.length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    db.query('SELECT * FROM appointments WHERE appointment_id = ? LIMIT 1', [id], (err, rows) => {
      if (err) {
        console.error('DB err fetch appointment:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });

      const appt = rows[0];
      const clientId = appt.client_id;

      const tasks = [];

      if (clientFields.length) {
        tasks.push((cb) => {
          const sql = `UPDATE clients SET ${clientFields.join(', ')} WHERE client_id = ?`;
          db.query(sql, [...clientParams, clientId], (e) => cb(e));
        });
      }

      if (apptFields.length) {
        tasks.push((cb) => {
          const sql = `UPDATE appointments SET ${apptFields.join(', ')} WHERE appointment_id = ?`;
          db.query(sql, [...apptParams, id], (e) => cb(e));
        });
      }

      function returnUpdated() {
        const sql = `
          SELECT
            a.appointment_id AS bookingID,
            a.appointment_id AS referenceID,
            c.first_name AS firstName,
            c.last_name AS lastName,
            c.phone,
            c.email,
            c.address,
            a.booking_date,
            a.appointment_time,
            CONCAT(
              COALESCE(a.booking_date, ''),
              CASE WHEN a.appointment_time IS NOT NULL
                   THEN CONCAT(' ', a.appointment_time)
                   ELSE ''
              END
            ) AS date,
            p.package_id,
            p.package_name AS serviceName,
            a.staff_id
          FROM appointments a
          LEFT JOIN clients c ON a.client_id = c.client_id
          LEFT JOIN packages p ON a.package_id = p.package_id
          WHERE a.appointment_id = ?
          LIMIT 1
        `;
        db.query(sql, [id], (err2, outRows) => {
          if (err2) {
            console.error('DB err returnUpdated:', err2);
            return res.status(500).json({ message: 'Database error' });
          }
          return res.json({ booking: outRows[0] });
        });
      }

      (function run(i) {
        if (i >= tasks.length) return returnUpdated();
        tasks[i]((e) => {
          if (e) {
            console.error('DB err updating:', e);
            return res.status(500).json({ message: 'Database error', error: e.message });
          }
          run(i + 1);
        });
      })(0);
    });
  });

  // DELETE /api/bookings/delete/:id
  router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM appointments WHERE appointment_id = ?';
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
