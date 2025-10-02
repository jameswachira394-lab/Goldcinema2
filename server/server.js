// Simple cinema API with SQLite, JWT auth, and bookings
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const SECRET = process.env.JWT_SECRET || "goldcinema_secret_change_in_prod";
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, "db.sqlite");

const db = new sqlite3.Database(DB_FILE);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create tables if missing
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
    movie_id INTEGER,
    seats TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(movie_id) REFERENCES movies(id)
  )`);
});

// Helper: run SQL returning a Promise
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

// --- Auth ---
app.post("/api/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });

    const hashed = await bcrypt.hash(password, 10);
    await run(`INSERT INTO users (email, username, password) VALUES (?, ?, ?)`, [email, username, hashed]);
    res.json({ success: true, message: "Registered" });
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await get(`SELECT * FROM users WHERE username = ? OR email = ?`, [usernameOrEmail, usernameOrEmail]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Create token payload (don't include password)
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, SECRET, { expiresIn: "8h" });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Middleware: protect routes
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Movies ---
app.get("/api/movies", async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM movies ORDER BY title`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/movies/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const row = await get(`SELECT * FROM movies WHERE id = ?`, [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Bookings ---
app.post("/api/bookings", authMiddleware, async (req, res) => {
  try {
    const { movie_id, seats } = req.body;
    if (!movie_id || !seats) return res.status(400).json({ error: "Missing fields" });

    const created_at = new Date().toISOString();
    const result = await run(`INSERT INTO bookings (user_id, movie_id, seats, created_at) VALUES (?, ?, ?, ?)`, [
      req.user.id,
      movie_id,
      JSON.stringify(seats),
      created_at,
    ]);
    res.json({ success: true, bookingId: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/my-bookings", authMiddleware, async (req, res) => {
  try {
    const book = await all(
      `SELECT b.id, b.movie_id, m.title as movie_title, b.seats, b.created_at
       FROM bookings b
       LEFT JOIN movies m ON m.id = b.movie_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    // parse seats
    book.forEach(b => {
      try { b.seats = JSON.parse(b.seats); } catch(e){ b.seats = []; }
    });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- Admin endpoints ---
function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ error: "Admin required" });
}

app.get("/api/admin/users", authMiddleware, adminOnly, async (req, res) => {
  const rows = await all(`SELECT id, email, username, role FROM users ORDER BY id DESC`);
  res.json(rows);
});

app.get("/api/admin/bookings", authMiddleware, adminOnly, async (req, res) => {
  const rows = await all(`
    SELECT b.id, b.user_id, u.username, u.email, b.movie_id, m.title as movie_title, b.seats, b.created_at
    FROM bookings b
    LEFT JOIN users u ON u.id = b.user_id
    LEFT JOIN movies m ON m.id = b.movie_id
    ORDER BY b.created_at DESC
  `);
  rows.forEach(r => { try { r.seats = JSON.parse(r.seats); } catch(e){ r.seats = []; }});
  res.json(rows);
});

// Serve a minimal API-health endpoint
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Start server
app.listen(PORT, () => {
  console.log(`Gold Cinema API listening on http://localhost:${PORT}`);
});
