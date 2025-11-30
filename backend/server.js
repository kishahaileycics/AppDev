// backend/server.js
'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const db = require('./config/db'); // mysql2 pool
const app = express();

// --- Middlewares ---
app.use(cors()); // dev: allow all origins. In production restrict this.
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies if needed

// --- Health check ---
app.get('/', (req, res) => res.send('Backend running'));

// --- Auth routes (kept as you asked) ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

  db.query(
    'SELECT id, firstName, lastName, email, password, role FROM users WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('DB error (login):', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (!results || results.length === 0)
        return res.status(401).json({ message: 'Invalid email or password' });

      const user = results[0];
      // NOTE: plain-text comparison here to preserve your existing behaviour.
      // In production, use bcrypt and tokens.
      if (user.password !== password)
        return res.status(401).json({ message: 'Invalid email or password' });

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body || {};
  if (!firstName || !lastName || !phone || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  db.query(
    'INSERT INTO users (firstName, lastName, phone, email, password) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, phone, email, password],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already registered' });
        console.error('DB insert error (signup):', err);
        return res.status(500).json({ message: 'Database error' });
      }
      return res.json({ message: 'User registered', id: result.insertId });
    }
  );
});

// --- Mount packages router factory (safe require) ---
try {
  // packages router should export a factory: module.exports = (db) => router
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

// --- Optional: API 404 handler ---
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
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// --- Graceful shutdown (optional) ---
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
