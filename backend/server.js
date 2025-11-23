const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) console.error('❌ DB Connection Failed:', err.message);
    else console.log('✅ Connected to MySQL Database');
});

app.post('/api/auth/signup', (req, res) => {
    const { firstName, lastName, phone, email, password } = req.body;
    const sql = 'INSERT INTO users (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [firstName, lastName, phone, email, password], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: 'User registered successfully' });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, data) => {
        if (err) return res.status(500).json({ message: err.message });
        if (data.length > 0) return res.status(200).json({ message: 'Login Success' });
        return res.status(401).json({ message: 'Invalid Credentials' });
    });
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));