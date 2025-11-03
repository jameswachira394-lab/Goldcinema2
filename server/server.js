// Gold Cinema API + M-Pesa STK Push Integration
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const axios = require("axios");

const SECRET = process.env.JWT_SECRET || "goldcinema_secret_change_in_prod";
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, "db.sqlite");
const db = new sqlite3.Database(DB_FILE);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// ====== DATABASE SETUP ======
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    description TEXT,
    poster TEXT,
    duration INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    event_type TEXT,
    event_title TEXT,
    category TEXT,
    quantity INTEGER,
    amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// ====== HELPERS ======
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function handleError(err, res) {
  console.error(err);
  res.status(500).json({ error: "Server error" });
}

// ====== AUTH ======
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: "Missing fields" });
    const hashed = await bcrypt.hash(password, 10);
    await run(`INSERT INTO users (email, username, password) VALUES (?, ?, ?)`, [
      email,
      username,
      hashed,
    ]);
    res.json({ success: true, message: "Registered" });
  } catch (err) {
    if (err.message.includes("UNIQUE"))
      return res.status(400).json({ error: "Email or username exists" });
    handleError(err, res);
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const user = await get(
      `SELECT * FROM users WHERE username = ? OR email = ?`,
      [usernameOrEmail, usernameOrEmail]
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, SECRET, { expiresIn: "8h" });
    res.json({ token, user: payload });
  } catch (err) {
    handleError(err, res);
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ====== MOVIES ======
app.get("/api/movies", async (req, res) => {
  try {
    res.json(await all(`SELECT * FROM movies ORDER BY title`));
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/api/movies/:id", async (req, res) => {
  try {
    res.json(await get(`SELECT * FROM movies WHERE id=?`, [req.params.id]));
  } catch (err) {
    handleError(err, res);
  }
});

// ====== BOOKINGS ======
app.post("/api/bookings", authMiddleware, async (req, res) => {
  const {
    eventId,
    eventType,
    eventTitle,
    category,
    quantity,
    amount,
  } = req.body;

  if (!eventId || !eventType || !eventTitle || !category || !quantity || !amount) {
    return res.status(400).json({ error: "Missing booking details" });
  }

  try {
    const r = await run(
      `INSERT INTO bookings (user_id, event_id, event_type, event_title, category, quantity, amount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, eventId, eventType, eventTitle, category, quantity, amount]
    );
    res.json({ success: true, bookingId: r.lastID });
  } catch (err) {
    handleError(err, res);
  }
});
app.get("/api/my-bookings", authMiddleware, async (req, res) => {
  try {
    const rows = await all(`
      SELECT id, event_title, event_type, category, quantity, amount, status, created_at, paid
      FROM bookings
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    handleError(err, res);
  }
});

// ====== M-PESA CONFIG ======
const MPESA = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortCode: process.env.MPESA_SHORTCODE || "174379", // demo Paybill
  passKey: process.env.MPESA_PASSKEY,
  callbackURL: process.env.MPESA_CALLBACK_URL || "https://yourdomain.com/api/mpesa/callback",
  env: process.env.MPESA_ENV || "sandbox",
};

async function getAccessToken() {
  const url =
    MPESA.env === "sandbox"
      ? "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = Buffer.from(`${MPESA.consumerKey}:${MPESA.consumerSecret}`).toString("base64");
  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
}

app.post("/api/pay", authMiddleware, async (req, res) => {
  try {
    const { phone, amount, bookingId } = req.body;
    if (!phone || !amount || !bookingId)
      return res.status(400).json({ error: "Missing parameters" });

    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(
      MPESA.shortCode + MPESA.passKey + timestamp
    ).toString("base64");

    const stkURL =
      MPESA.env === "sandbox"
        ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: MPESA.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: MPESA.shortCode,
      PhoneNumber: phone,
      CallBackURL: `${MPESA.callbackURL}?bookingId=${bookingId}`,
      AccountReference: `Booking-${bookingId}`,
      TransactionDesc: "Gold Cinema Ticket",
    };

    const mpesaRes = await axios.post(stkURL, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json({
      success: true,
      message: "STK push initiated",
      data: mpesaRes.data,
    });
  } catch (err) {
    console.error("M-Pesa error:", err.response?.data || err.message);
    res.status(500).json({ error: "M-Pesa request failed" });
  }
});

// ====== M-PESA CALLBACK ======
app.post("/api/mpesa/callback", async (req, res) => {
  try {
    const { bookingId } = req.query;
    const result = req.body?.stkCallback;

    if (!result) return res.status(400).end();
    console.log('M-Pesa Callback for bookingId:', bookingId, JSON.stringify(result, null, 2));

    if (result.ResultCode === 0) {
      // Payment was successful
      if (bookingId) {
        await run(`UPDATE bookings SET paid=1, status='completed' WHERE id=?`, [bookingId]);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Callback error:", err);
    res.status(200).json({ ok: false });
  }
});

// ====== ADMIN ======
function adminOnly(req, res, next) {
  if (req.user?.role === "admin") return next();
  res.status(403).json({ error: "Admin only" });
}
app.get("/api/admin/users", authMiddleware, adminOnly, async (req, res) => {
  res.json(await all(`SELECT id, email, username, role FROM users`));
});
app.get("/api/admin/bookings", authMiddleware, adminOnly, async (req, res) => {
  const rows = await all(
    `SELECT b.*, u.username
     FROM bookings b
     LEFT JOIN users u ON u.id=b.user_id
     ORDER BY b.created_at DESC`
  );
  res.json(rows);
});

// ====== HEALTH ======
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ====== SERVER ======
app.listen(PORT, () => console.log(`Gold Cinema API on http://localhost:${PORT}`));
