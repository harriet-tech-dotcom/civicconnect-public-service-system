
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("civicconnect.db");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from .env");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Create database tables
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen'
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_code TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Create a demo administrator if one does not exist
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters");
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email.toLowerCase());

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'admin')
    `).run("CivicConnect Administrator", email.toLowerCase(), hashedPassword);

    console.log("Demo administrator created.");
  }
}

// Verify a login token
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    req.user = jwt.verify(
      header.substring(7),
      process.env.JWT_SECRET
    );
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired login." });
  }
}

// Restrict sensitive operations to administrators
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Administrator access required." });
  }
  next();
}

// Citizen registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Enter a name, valid email, and password of at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'citizen')
    `).run(name.trim(), normalizedEmail, hashedPassword);

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: normalizedEmail,
        role: "citizen"
      }
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ message: "That email is already registered." });
    }
    console.error(error);
    res.status(500).json({ message: "Could not create account." });
  }
});

// Citizen and administrator login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
});

// Get requests: citizens see their own; admins see all
app.get("/api/requests", authenticate, (req, res) => {
  const query = req.user.role === "admin"
    ? db.prepare(`
        SELECT r.*, u.name AS citizen_name
        FROM requests r JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
      `)
    : db.prepare(`
        SELECT * FROM requests
        WHERE user_id = ?
        ORDER BY id DESC
      `);

  const requests = req.user.role === "admin"
    ? query.all()
    : query.all(req.user.id);

  res.json(requests);
});

// Submit a service request
app.post("/api/requests", authenticate, (req, res) => {
  const { category, location, description, image } = req.body;

  if (
    typeof category !== "string" || !category.trim() ||
    typeof location !== "string" || !location.trim() ||
    typeof description !== "string" || !description.trim()
  ) {
    return res.status(400).json({
      message: "Category, location, and description are required."
    });
  }

  if (image != null && image !== "") {
    if (
      typeof image !== "string" ||
      !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(image) ||
      image.length > 700000
    ) {
      return res.status(400).json({
        message: "Use a supported image smaller than approximately 500 KB."
      });
    }
  }

  const requestCode = `PSR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const result = db.prepare(`
    INSERT INTO requests
      (request_code, user_id, category, location, description, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    requestCode,
    req.user.id,
    category.trim(),
    location.trim(),
    description.trim(),
    image || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    request_code: requestCode,
    category: category.trim(),
    location: location.trim(),
    description: description.trim(),
    image: image || null,
    status: "Pending"
  });
});

// Change request status: administrators only
app.patch("/api/requests/:id/status", authenticate, adminOnly, (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["Pending", "In Progress", "Resolved"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid request status." });
  }

  const result = db.prepare(
    "UPDATE requests SET status = ? WHERE id = ?"
  ).run(status, req.params.id);

  if (!result.changes) {
    return res.status(404).json({ message: "Request not found." });
  }

  res.json({ message: "Request status updated.", status });
});

// Basic health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CivicConnect API" });
});

const PORT = process.env.PORT || 5000;

seedAdmin()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CivicConnect API running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not start server:", error.message);
    process.exit(1);
  });
