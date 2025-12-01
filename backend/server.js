// backend/server.js
'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const db = require('./config/db'); // mysql2 pool (callback-style)
const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get('/', (req, res) => res.send('Backend running'));

/*
  AUTH endpoints using `clients` table:

  - POST /api/auth/login
      body: { email, password }

  - POST /api/auth/signup
      body: { firstName, lastName, phone, email, password }
*/

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  const sql = `
    SELECT
      client_id AS id,
      first_name,
      last_name,
      phone,
      email,
      password,
      role
    FROM clients
    WHERE email = ?
    LIMIT 1
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('DB error (login):', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!results || results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const client = results[0];

    // Plain-text comparison to match your current setup.
    // (Later, we can swap this to bcrypt.)
    if (client.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      user: {
        id: client.id,
        firstName: client.first_name || '',
        lastName: client.last_name || '',
        email: client.email,
        role: client.role || 'user',
        phone: client.phone || ''
      }
    });
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body || {};
  if (!firstName || !lastName || !phone || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const sql = `
    INSERT INTO clients (first_name, last_name, phone, email, address, password, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [firstName, lastName, phone, email, null, password, 'user'];

  db.query(sql, params, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Email already registered' });
      }
      console.error('DB insert error (signup):', err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.json({ message: 'User registered', id: result.insertId });
  });
});

// --- Mount packages router ---
try {
  const packagesRouterFactory = require('./routes/packages');
  if (typeof packagesRouterFactory !== 'function') {
    console.error('packages router did not export a function. Check routes/packages.js');
  } else {
    const packagesRouter = packagesRouterFactory(db);
    app.use('/api/packages', packagesRouter);
    console.log('Mounted /api/packages route.');
  }
} catch (err) {
  console.error('Failed to load packages router:', err && err.stack ? err.stack : err);
}

// --- Mount bookings router ---
try {
  const bookingsRouterFactory = require('./routes/bookings');
  if (typeof bookingsRouterFactory !== 'function') {
    console.error('bookings router did not export a function. Check routes/bookings.js');
  } else {
    const bookingsRouter = bookingsRouterFactory(db);
    app.use('/api/bookings', bookingsRouter);
    console.log('Mounted /api/bookings route.');
  }
} catch (err) {
  console.error('Failed to load bookings router:', err && err.stack ? err.stack : err);
}

// --- API 404 handler ---
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// --- Graceful shutdown ---
function shutdown(reason) {
  console.log('Shutting down server...', reason || '');
  server.close(() => {
    console.log('HTTP server closed.');
    try {
      if (db && typeof db.end === 'function') {
        db.end((err) => {
          if (err) console.error('Error closing DB pool:', err);
          else console.log('DB pool closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    } catch (e) {
      console.error('Error during DB pool close:', e);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forcing shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});
