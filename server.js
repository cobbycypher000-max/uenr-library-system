const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Library data ──────────────────────────────────────────────
const LIBRARIES = {
  main:  { id: "main",  name: "Main Library",   capacity: 105, occupied: 0 },
  annex: { id: "annex", name: "Library Annex",  capacity: 32,  occupied: 0 },
  hall1: { id: "hall1", name: "Hall 1 Library", capacity: 50,  occupied: 0 },
  rcees: { id: "rcees", name: "RCEEs Library",  capacity: 20,  occupied: 0 },
  elib:  { id: "elib",  name: "E-Library",      capacity: 40,  occupied: 0 },
};

// Activity log (last 100 entries kept in memory)
const activityLog = [];
function addLog(libId, action) {
  const lib = LIBRARIES[libId];
  activityLog.unshift({
    time: new Date().toISOString(),
    library: lib.name,
    action,
    occupied: lib.occupied,
    available: lib.capacity - lib.occupied,
  });
  if (activityLog.length > 100) activityLog.pop();
}

// ── API routes ────────────────────────────────────────────────

// GET /api/status  →  all library statuses
app.get("/api/status", (req, res) => {
  const libs = Object.values(LIBRARIES).map((l) => ({
    ...l,
    available: l.capacity - l.occupied,
    percentFull: Math.round((l.occupied / l.capacity) * 100),
    status: l.occupied >= l.capacity ? "full" : l.occupied / l.capacity >= 0.8 ? "busy" : "open",
  }));
  res.json({ libs, updatedAt: new Date().toISOString() });
});

// GET /api/status/:id  →  single library
app.get("/api/status/:id", (req, res) => {
  const lib = LIBRARIES[req.params.id];
  if (!lib) return res.status(404).json({ error: "Library not found" });
  res.json({
    ...lib,
    available: lib.capacity - lib.occupied,
    percentFull: Math.round((lib.occupied / lib.capacity) * 100),
    status: lib.occupied >= lib.capacity ? "full" : lib.occupied / lib.capacity >= 0.8 ? "busy" : "open",
  });
});

// POST /api/checkin/:id  →  check in (add 1)
app.post("/api/checkin/:id", (req, res) => {
  const lib = LIBRARIES[req.params.id];
  if (!lib) return res.status(404).json({ error: "Library not found" });
  if (lib.occupied >= lib.capacity)
    return res.status(409).json({ error: "Library is full", available: 0 });
  lib.occupied++;
  addLog(lib.id, "checkin");
  res.json({ success: true, occupied: lib.occupied, available: lib.capacity - lib.occupied });
});

// POST /api/checkout/:id  →  check out (subtract 1)
app.post("/api/checkout/:id", (req, res) => {
  const lib = LIBRARIES[req.params.id];
  if (!lib) return res.status(404).json({ error: "Library not found" });
  if (lib.occupied <= 0)
    return res.status(409).json({ error: "No occupants to check out" });
  lib.occupied--;
  addLog(lib.id, "checkout");
  res.json({ success: true, occupied: lib.occupied, available: lib.capacity - lib.occupied });
});

// GET /api/log  →  recent activity
app.get("/api/log", (req, res) => {
  res.json(activityLog.slice(0, 50));
});

// GET /api/reset/:id  →  admin reset a library to 0 (protect in production with a PIN)
app.post("/api/reset/:id", (req, res) => {
  const lib = LIBRARIES[req.params.id];
  if (!lib) return res.status(404).json({ error: "Library not found" });
  lib.occupied = 0;
  addLog(lib.id, "reset");
  res.json({ success: true });
});

// Catch-all: serve index.html for all other routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UENR Library server running on http://localhost:${PORT}`));
