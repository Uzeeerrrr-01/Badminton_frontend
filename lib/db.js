import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { DatabaseSync } from "node:sqlite";
import {
  scorePoint,
  undoLastPoint,
  recordLet,
  initializeMatchState,
  checkWinner,
  isDoublesCategory,
  CATEGORIES,
} from "./scoringEngine.js";

// Global EventEmitter for real-time live match and score updates
if (!global.__badmintonEmitter) {
  global.__badmintonEmitter = new EventEmitter();
  global.__badmintonEmitter.setMaxListeners(100);
}
export const realtimeEmitter = global.__badmintonEmitter;

// Initialize SQLite database
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "badminton.sqlite");

let dbInstance = null;
function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_settings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo_url TEXT,
      venue TEXT,
      number_of_courts INTEGER DEFAULT 4,
      points_per_win INTEGER DEFAULT 3,
      points_per_participation INTEGER DEFAULT 1,
      bonus_sweep_points INTEGER DEFAULT 1,
      ranking_type TEXT DEFAULT 'both',
      scoring_target_points INTEGER DEFAULT 11,
      scoring_deuce_lead INTEGER DEFAULT 2,
      scoring_max_points INTEGER DEFAULT 15,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS administrators (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      player_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      profile_image TEXT,
      registration_status TEXT DEFAULT 'Active',
      eligible_categories TEXT, -- JSON array
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      round TEXT NOT NULL,
      match_number INTEGER,
      court_number INTEGER DEFAULT 1,
      scheduled_time TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      team_a_id TEXT,
      team_a_name TEXT NOT NULL,
      team_a_player1_id TEXT NOT NULL,
      team_a_player2_id TEXT,
      score_a INTEGER DEFAULT 0,
      team_b_id TEXT,
      team_b_name TEXT NOT NULL,
      team_b_player1_id TEXT NOT NULL,
      team_b_player2_id TEXT,
      score_b INTEGER DEFAULT 0,
      serving_team TEXT DEFAULT 'A',
      serving_player_id TEXT,
      receiving_player_id TEXT,
      service_court TEXT DEFAULT 'right',
      team_a_positions TEXT, -- JSON
      team_b_positions TEXT, -- JSON
      court_side_a TEXT DEFAULT 'left',
      toss_winner TEXT,
      toss_choice TEXT,
      winner_team TEXT,
      winner_name TEXT,
      next_match_id TEXT,
      next_match_slot TEXT,
      history TEXT, -- JSON array
      started_at TEXT,
      completed_at TEXT,
      timer_duration_seconds INTEGER DEFAULT 0,
      timer_enabled INTEGER DEFAULT 0,
      timer_status TEXT DEFAULT 'stopped',
      timer_start_ts TEXT,
      timer_paused_at TEXT,
      timer_remaining_seconds INTEGER DEFAULT 0,
      completion_reason TEXT DEFAULT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tournament_points (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      category TEXT NOT NULL,
      matches_played INTEGER DEFAULT 0,
      matches_won INTEGER DEFAULT 0,
      matches_lost INTEGER DEFAULT 0,
      points_scored INTEGER DEFAULT 0,
      points_conceded INTEGER DEFAULT 0,
      total_tournament_points INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 1,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS points_history (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      category TEXT NOT NULL,
      points_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by TEXT DEFAULT 'Admin',
      created_at TEXT
    );
  `);

  // Migrate existing databases: add new columns if they don't exist
  const migrateColumns = [
    "ALTER TABLE matches ADD COLUMN timer_duration_seconds INTEGER DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN timer_enabled INTEGER DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN timer_status TEXT DEFAULT 'stopped'",
    "ALTER TABLE matches ADD COLUMN timer_start_ts TEXT",
    "ALTER TABLE matches ADD COLUMN timer_paused_at TEXT",
    "ALTER TABLE matches ADD COLUMN timer_remaining_seconds INTEGER DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN completion_reason TEXT",
    "ALTER TABLE matches ADD COLUMN timer_mode TEXT DEFAULT 'COUNTDOWN'",
    "ALTER TABLE matches ADD COLUMN is_sudden_death INTEGER DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN sudden_death_start_ts TEXT",

    "ALTER TABLE players ADD COLUMN matches_played INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN matches_won INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN matches_lost INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN points_scored INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN points_conceded INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN tournament_points INTEGER DEFAULT 0",
    "ALTER TABLE players ADD COLUMN win_rate INTEGER DEFAULT 0",

    "ALTER TABLE teams ADD COLUMN matches_played INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN matches_won INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN matches_lost INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN points_scored INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN points_conceded INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN tournament_points INTEGER DEFAULT 0",
    "ALTER TABLE teams ADD COLUMN win_rate INTEGER DEFAULT 0",
  ];
  for (const sql of migrateColumns) {
    try { db.prepare(sql).run(); } catch (_) { /* column already exists */ }
  }

  // Seed default settings and data if empty
  seedInitialData(db);
}

function seedInitialData(db) {
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM tournament_settings").get();
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO tournament_settings (
        id, name, description, venue, number_of_courts,
        points_per_win, points_per_participation, bonus_sweep_points,
        ranking_type, scoring_target_points, scoring_deuce_lead, scoring_max_points, updated_at
      ) VALUES (
        'default', 'Apex Badminton Open 2026',
        'Official collegiate & regional badminton championship with fast-paced 11-point tournament rally scoring.',
        'Grand Court Arena, Pavilion Hall', 4,
        3, 1, 1, 'both', 11, 2, 15, '${new Date().toISOString()}'
      )
    `).run();
  }

  // Admin user
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM administrators").get();
  if (adminCount.count === 0) {
    db.prepare(`
      INSERT INTO administrators (id, email, password, name, role, created_at)
      VALUES ('adm-1', 'admin@badminton.org', 'admin123', 'Head Umpire & Tournament Director', 'admin', '${new Date().toISOString()}')
    `).run();
  }

  // Initial database starts clean with registered players
}

// ==========================================
// TOURNAMENT SETTINGS
// ==========================================

export function getSettings() {
  const db = getDb();
  return db.prepare("SELECT * FROM tournament_settings WHERE id = 'default'").get();
}

export function updateSettings(data) {
  const db = getDb();
  const current = getSettings();
  const updated = { ...current, ...data, updated_at: new Date().toISOString() };

  db.prepare(`
    UPDATE tournament_settings SET
      name = ?, description = ?, logo_url = ?, venue = ?,
      number_of_courts = ?, points_per_win = ?, points_per_participation = ?,
      bonus_sweep_points = ?, ranking_type = ?, scoring_target_points = ?,
      scoring_deuce_lead = ?, scoring_max_points = ?, updated_at = ?
    WHERE id = 'default'
  `).run(
    updated.name, updated.description, updated.logo_url, updated.venue,
    Number(updated.number_of_courts), Number(updated.points_per_win), Number(updated.points_per_participation),
    Number(updated.bonus_sweep_points), updated.ranking_type, Number(updated.scoring_target_points),
    Number(updated.scoring_deuce_lead), Number(updated.scoring_max_points), updated.updated_at
  );

  realtimeEmitter.emit("settings_update", updated);
  return updated;
}

// ==========================================
// PLAYERS
// ==========================================

export function getPlayers({ search = "", category = "", gender = "", status = "" } = {}) {
  const db = getDb();
  let query = "SELECT * FROM players WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (full_name LIKE ? OR player_id LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (gender) {
    query += " AND gender = ?";
    params.push(gender);
  }
  if (status) {
    query += " AND registration_status = ?";
    params.push(status);
  }

  query += " ORDER BY player_id ASC";
  const rows = db.prepare(query).all(...params);

  return rows.map((r) => ({
    ...r,
    eligible_categories: r.eligible_categories ? JSON.parse(r.eligible_categories) : [],
  })).filter((r) => {
    if (!category) return true;
    return r.eligible_categories.includes(category);
  });
}

export function getPlayer(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM players WHERE id = ? OR player_id = ?").get(id, id);
  if (!row) return null;
  return {
    ...row,
    eligible_categories: row.eligible_categories ? JSON.parse(row.eligible_categories) : [],
  };
}

export function createPlayer(data) {
  const db = getDb();
  const id = `ply-${Date.now().toString(36)}`;
  
  // Generate sequential player ID if not provided
  let playerId = data.player_id;
  if (!playerId) {
    const total = db.prepare("SELECT COUNT(*) as count FROM players").get().count;
    playerId = `PLY-${String(total + 1).padStart(3, "0")}`;
  }

  // Validate gender vs eligible categories
  validateCategoryEligibility(data.gender, data.eligible_categories || []);

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO players (id, player_id, full_name, gender, contact_email, contact_phone, profile_image, registration_status, eligible_categories, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    playerId,
    data.full_name,
    data.gender,
    data.contact_email || null,
    data.contact_phone || null,
    data.profile_image || null,
    data.registration_status || "Active",
    JSON.stringify(data.eligible_categories || []),
    now,
    now
  );

  return getPlayer(id);
}

export function updatePlayer(id, data) {
  const db = getDb();
  const existing = getPlayer(id);
  if (!existing) throw new Error("Player not found");

  const gender = data.gender || existing.gender;
  const categories = data.eligible_categories !== undefined ? data.eligible_categories : existing.eligible_categories;

  validateCategoryEligibility(gender, categories);

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE players SET
      full_name = ?, gender = ?, contact_email = ?, contact_phone = ?,
      profile_image = ?, registration_status = ?, eligible_categories = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.full_name || existing.full_name,
    gender,
    data.contact_email !== undefined ? data.contact_email : existing.contact_email,
    data.contact_phone !== undefined ? data.contact_phone : existing.contact_phone,
    data.profile_image !== undefined ? data.profile_image : existing.profile_image,
    data.registration_status || existing.registration_status,
    JSON.stringify(categories),
    now,
    id
  );

  return getPlayer(id);
}

export function deletePlayer(id) {
  const db = getDb();
  const pl = db.prepare("SELECT * FROM players WHERE id = ? OR player_id = ?").get(id, id);
  const targetId = pl?.id || id;
  const targetPlayerId = pl?.player_id || id;

  db.prepare("DELETE FROM teams WHERE player1_id = ? OR player2_id = ? OR player1_id = ? OR player2_id = ?")
    .run(targetId, targetId, targetPlayerId, targetPlayerId);
  db.prepare("DELETE FROM players WHERE id = ? OR player_id = ?")
    .run(targetId, targetPlayerId);
  db.prepare("DELETE FROM tournament_points WHERE entity_id = ? OR entity_id = ?")
    .run(targetId, targetPlayerId);
  db.prepare("DELETE FROM points_history WHERE entity_id = ? OR entity_id = ?")
    .run(targetId, targetPlayerId);

  // Sync to database if backend service is available
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.BACKEND_URL || "http://localhost:5050";
  fetch(`${backendUrl}/api/players/${targetId}`, { method: "DELETE" }).catch(() => {});

  return { success: true };
}

function validateCategoryEligibility(gender, categories) {
  for (const cat of categories) {
    if (gender === "Male") {
      if (cat.includes("Women's")) {
        throw new Error(`Incompatible category: Male player cannot participate in ${cat}`);
      }
    } else if (gender === "Female") {
      if (cat.includes("Men's")) {
        throw new Error(`Incompatible category: Female player cannot participate in ${cat}`);
      }
    }
  }
}

// ==========================================
// TEAMS
// ==========================================

export function getTeams({ category = "", search = "" } = {}) {
  const db = getDb();
  let query = "SELECT * FROM teams WHERE 1=1";
  const params = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";
  const teams = db.prepare(query).all(...params);

  // Attach player details
  return teams.map((t) => {
    const p1 = t.player1_id ? getPlayer(t.player1_id) : null;
    const p2 = t.player2_id ? getPlayer(t.player2_id) : null;
    return { ...t, player1: p1, player2: p2 };
  });
}

export function getTeam(id) {
  const db = getDb();
  const t = db.prepare("SELECT * FROM teams WHERE id = ?").get(id);
  if (!t) return null;
  return {
    ...t,
    player1: t.player1_id ? getPlayer(t.player1_id) : null,
    player2: t.player2_id ? getPlayer(t.player2_id) : null,
  };
}

export function createTeam(data) {
  const db = getDb();
  const { name, category, player1_id, player2_id } = data;

  if (player1_id === player2_id) {
    throw new Error("A player cannot be partnered with themselves.");
  }

  const p1 = getPlayer(player1_id);
  const p2 = player2_id ? getPlayer(player2_id) : null;

  if (!p1) throw new Error("Player 1 not found");
  if (isDoublesCategory(category) && !p2) {
    throw new Error("Doubles requires two players per team");
  }

  // Validate Mixed Doubles gender requirement: 1 Male, 1 Female
  if (category === "Mixed Doubles") {
    if (!((p1.gender === "Male" && p2.gender === "Female") || (p1.gender === "Female" && p2.gender === "Male"))) {
      throw new Error("Mixed Doubles team must consist of exactly one male and one female player.");
    }
  } else if (category === "Men's Doubles") {
    if (p1.gender !== "Male" || p2.gender !== "Male") {
      throw new Error("Men's Doubles requires both players to be Male.");
    }
  } else if (category === "Women's Doubles") {
    if (p1.gender !== "Female" || p2.gender !== "Female") {
      throw new Error("Women's Doubles requires both players to be Female.");
    }
  }

  const id = `tm-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO teams (id, name, category, player1_id, player2_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Active', ?, ?)
  `).run(id, name, category, player1_id, player2_id || null, now, now);

  return getTeam(id);
}

export function updateTeam(id, data) {
  const db = getDb();
  const existing = getTeam(id);
  if (!existing) throw new Error("Team not found");

  const name = data.name || existing.name;
  const category = data.category || existing.category;
  const p1Id = data.player1_id || existing.player1_id;
  const p2Id = data.player2_id !== undefined ? data.player2_id : existing.player2_id;

  if (p1Id === p2Id) {
    throw new Error("A player cannot be partnered with themselves.");
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE teams SET name = ?, category = ?, player1_id = ?, player2_id = ?, updated_at = ?
    WHERE id = ?
  `).run(name, category, p1Id, p2Id, now, id);

  return getTeam(id);
}

export function deleteTeam(id) {
  const db = getDb();
  db.prepare("DELETE FROM teams WHERE id = ?").run(id);
  db.prepare("DELETE FROM tournament_points WHERE entity_id = ?").run(id);
  db.prepare("DELETE FROM points_history WHERE entity_id = ?").run(id);

  // Sync to database if backend service is available
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.BACKEND_URL || "http://localhost:5050";
  fetch(`${backendUrl}/api/teams/${id}`, { method: "DELETE" }).catch(() => {});

  return { success: true };
}

// ==========================================
// MATCHES & SCORING
// ==========================================

export function getMatches({ status = "", category = "", court = null } = {}) {
  const db = getDb();
  let query = "SELECT * FROM matches WHERE 1=1";
  const params = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (court) {
    query += " AND court_number = ?";
    params.push(Number(court));
  }

  query += " ORDER BY court_number ASC, match_number ASC, created_at ASC";
  const rows = db.prepare(query).all(...params);

  return rows.map(formatMatchRow);
}

export function getMatch(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM matches WHERE id = ?").get(id);
  if (!row) return null;
  return formatMatchRow(row);
}

function formatMatchRow(row) {
  return {
    ...row,
    team_a_positions: row.team_a_positions ? JSON.parse(row.team_a_positions) : {},
    team_b_positions: row.team_b_positions ? JSON.parse(row.team_b_positions) : {},
    history: row.history ? JSON.parse(row.history) : [],
    team_a_player1: row.team_a_player1_id ? getPlayer(row.team_a_player1_id) : null,
    team_a_player2: row.team_a_player2_id ? getPlayer(row.team_a_player2_id) : null,
    team_b_player1: row.team_b_player1_id ? getPlayer(row.team_b_player1_id) : null,
    team_b_player2: row.team_b_player2_id ? getPlayer(row.team_b_player2_id) : null,
  };
}

export function createMatch(data) {
  const db = getDb();
  const id = `mth-${Date.now().toString(36)}`;
  const total = db.prepare("SELECT COUNT(*) as count FROM matches").get().count;
  const matchNumber = data.match_number || total + 1;
  const now = new Date().toISOString();

  const timerEnabled = data.timer_enabled ? 1 : 0;
  const timerDuration = timerEnabled ? (Number(data.timer_duration_seconds) || 0) : 0;

  // Initial court positions
  const isDoubles = isDoublesCategory(data.category);
  const initialPosA = isDoubles
    ? { right: data.team_a_player1_id, left: data.team_a_player2_id }
    : { right: data.team_a_player1_id, left: null };
  const initialPosB = isDoubles
    ? { right: data.team_b_player1_id, left: data.team_b_player2_id }
    : { right: data.team_b_player1_id, left: null };

  db.prepare(`
    INSERT INTO matches (
      id, category, round, match_number, court_number, scheduled_time, status,
      team_a_id, team_a_name, team_a_player1_id, team_a_player2_id, score_a,
      team_b_id, team_b_name, team_b_player1_id, team_b_player2_id, score_b,
      serving_team, serving_player_id, receiving_player_id, service_court,
      team_a_positions, team_b_positions, court_side_a, next_match_id, next_match_slot,
      timer_enabled, timer_duration_seconds, timer_remaining_seconds,
      history, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 'scheduled',
      ?, ?, ?, ?, 0,
      ?, ?, ?, ?, 0,
      'A', ?, ?, 'right',
      ?, ?, 'left', ?, ?,
      ?, ?, ?,
      '[]', ?, ?
    )
  `).run(
    id, data.category, data.round || "Round of 16", matchNumber, Number(data.court_number || 1),
    data.scheduled_time || null,
    data.team_a_id || null, data.team_a_name, data.team_a_player1_id, data.team_a_player2_id || null,
    data.team_b_id || null, data.team_b_name, data.team_b_player1_id, data.team_b_player2_id || null,
    data.team_a_player1_id, data.team_b_player1_id,
    JSON.stringify(initialPosA), JSON.stringify(initialPosB),
    data.next_match_id || null, data.next_match_slot || null,
    timerEnabled, timerDuration, timerDuration,
    now, now
  );

  const match = getMatch(id);
  realtimeEmitter.emit("match_update", match);
  return match;
}

export function updateMatch(id, data) {
  const db = getDb();
  const existing = getMatch(id);
  if (!existing) throw new Error("Match not found");

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE matches SET
      category = ?, round = ?, match_number = ?, court_number = ?,
      scheduled_time = ?, team_a_name = ?, team_b_name = ?,
      next_match_id = ?, next_match_slot = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.category || existing.category,
    data.round || existing.round,
    data.match_number ? Number(data.match_number) : existing.match_number,
    data.court_number ? Number(data.court_number) : existing.court_number,
    data.scheduled_time !== undefined ? data.scheduled_time : existing.scheduled_time,
    data.team_a_name || existing.team_a_name,
    data.team_b_name || existing.team_b_name,
    data.next_match_id !== undefined ? data.next_match_id : existing.next_match_id,
    data.next_match_slot !== undefined ? data.next_match_slot : existing.next_match_slot,
    now,
    id
  );

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

/**
 * Start match and initialize timer.
 * Sets match status to 'live', records timer duration and starts countdown.
 */
export function startMatchWithTimer(id, durationSeconds) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error('Match not found');
  if (match.status === 'live') throw new Error('Match already live');

  const now = new Date().toISOString();
  // Initialize match as live (reuse startMatchWithToss logic without toss)
  db.prepare(`
    UPDATE matches SET
      status = 'live',
      score_a = 0,
      score_b = 0,
      serving_team = 'A',
      serving_player_id = ?,
      receiving_player_id = ?,
      service_court = 'right',
      timer_duration_seconds = ?,
      timer_status = 'running',
      timer_start_ts = ?,
      timer_remaining_seconds = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    match.team_a_player1_id || null,
    match.team_b_player1_id || null,
    durationSeconds,
    now,
    durationSeconds,
    now,
    id
  );

  // Emit realtime update
  const updated = getMatch(id);
  realtimeEmitter.emit('match_update', updated);
  return updated;
}

/**
 * Handle timer control actions: pause, resume, reset
 */
export function updateTimerAction(id, action) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error('Match not found');

  const now = new Date().toISOString();

  if (action === 'pause') {
    const startTs = match.timer_start_ts ? new Date(match.timer_start_ts).getTime() : Date.now();
    const elapsed = Math.floor((Date.now() - startTs) / 1000);
    const baseRemaining = match.timer_remaining_seconds !== null && match.timer_remaining_seconds !== undefined
      ? match.timer_remaining_seconds
      : match.timer_duration_seconds;
    const remaining = Math.max(baseRemaining - elapsed, 0);
    db.prepare(
      "UPDATE matches SET timer_status = 'paused', timer_remaining_seconds = ?, timer_start_ts = NULL, updated_at = ? WHERE id = ?"
    ).run(remaining, now, id);
  } else if (action === 'resume' || action === 'start') {
    const startRem = match.timer_remaining_seconds > 0 ? match.timer_remaining_seconds : match.timer_duration_seconds;
    db.prepare(
      "UPDATE matches SET timer_status = 'running', timer_remaining_seconds = ?, timer_start_ts = ?, updated_at = ? WHERE id = ?"
    ).run(startRem, now, now, id);
  } else if (action === 'reset') {
    db.prepare(
      "UPDATE matches SET timer_status = 'stopped', timer_remaining_seconds = timer_duration_seconds, timer_start_ts = NULL, updated_at = ? WHERE id = ?"
    ).run(now, id);
  } else {
    throw new Error('Invalid timer action');
  }

  const updated = getMatch(id);
  realtimeEmitter.emit('match_update', updated);
  return updated;
}

/**
 * Check timer and finalize match when timer expires.
 * If timer reached zero and match not yet completed, determine winner based on current scores.
 */
export function checkAndFinalizeMatchByTimer(id) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error('Match not found');

  // If already completed or timer not running, just return match
  if (match.status === 'completed' || match.timer_status !== 'running') {
    return match;
  }

  // Compute remaining seconds based on start timestamp
  const now = Date.now();
  const startTs = match.timer_start_ts ? new Date(match.timer_start_ts).getTime() : now;
  const elapsed = Math.floor((now - startTs) / 1000);
  const baseRemaining = match.timer_remaining_seconds !== null && match.timer_remaining_seconds !== undefined
    ? match.timer_remaining_seconds
    : match.timer_duration_seconds;
  const remaining = Math.max(baseRemaining - elapsed, 0);

  // Update remaining seconds in DB
  db.prepare(`
    UPDATE matches SET timer_remaining_seconds = ?, timer_status = ? WHERE id = ?
  `).run(remaining, remaining === 0 ? 'stopped' : match.timer_status, id);

  if (remaining > 0) {
    return getMatch(id);
  }

  // Timer expired – decide winner if not already decided
  let winnerTeam = null;
  let winnerName = null;
  if (match.score_a > match.score_b) {
    winnerTeam = 'A';
    winnerName = match.team_a_name;
  } else if (match.score_b > match.score_a) {
    winnerTeam = 'B';
    winnerName = match.team_b_name;
  } else {
    // Tie – no winner, keep match as live but timer stopped
    winnerTeam = null;
    winnerName = null;
  }

  const completedAt = new Date().toISOString();
  // Tie: status becomes 'tied', not completed
  const newStatus = winnerTeam ? 'completed' : 'tied';
  const completionReason = winnerTeam ? 'TIME_EXPIRED_HIGHER_SCORE' : 'TIME_EXPIRED_TIED';

  db.prepare(`
    UPDATE matches SET
      status = ?,
      winner_team = ?,
      winner_name = ?,
      completed_at = ?,
      timer_status = 'stopped',
      timer_remaining_seconds = 0,
      completion_reason = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    newStatus,
    winnerTeam,
    winnerName,
    completedAt,
    completionReason,
    completedAt,
    id
  );

  // If we have a winner, run normal match completion handling
  if (winnerTeam) {
    const updatedMatch = getMatch(id);
    handleMatchCompletion(updatedMatch, winnerTeam, winnerName, updatedMatch.score_a, updatedMatch.score_b);
    realtimeEmitter.emit('match_update', updatedMatch);
    return updatedMatch;
  }

  const refreshed = getMatch(id);
  realtimeEmitter.emit('match_update', refreshed);
  return refreshed;
}

export function startMatchWithToss(id, tossData) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error("Match not found");

  // Prevent duplicate live matches involving the same player on different courts
  const activePlayers = [
    match.team_a_player1_id, match.team_a_player2_id,
    match.team_b_player1_id, match.team_b_player2_id
  ].filter(Boolean);

  const liveMatches = db.prepare("SELECT * FROM matches WHERE status = 'live' AND id != ?").all(id);
  for (const lm of liveMatches) {
    const lmPlayers = [lm.team_a_player1_id, lm.team_a_player2_id, lm.team_b_player1_id, lm.team_b_player2_id].filter(Boolean);
    const overlap = activePlayers.some((p) => lmPlayers.includes(p));
    if (overlap) {
      throw new Error(`Cannot start match: One of the players is already active in a live match on Court ${lm.court_number}.`);
    }
  }

  const teamAPlayers = [match.team_a_player1, match.team_a_player2].filter(Boolean);
  const teamBPlayers = [match.team_b_player1, match.team_b_player2].filter(Boolean);

  const initState = initializeMatchState({
    category: match.category,
    teamAPlayers,
    teamBPlayers,
    tossWinner: tossData.tossWinner || "A",
    tossChoice: tossData.tossChoice || "serve",
    courtSideA: tossData.courtSideA || "left",
    initialServerId: tossData.initialServerId || null,
    initialReceiverId: tossData.initialReceiverId || null,
  });

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE matches SET
      status = 'live',
      score_a = 0, score_b = 0,
      serving_team = ?,
      serving_player_id = ?,
      receiving_player_id = ?,
      service_court = ?,
      team_a_positions = ?,
      team_b_positions = ?,
      court_side_a = ?,
      toss_winner = ?,
      toss_choice = ?,
      winner_team = NULL,
      winner_name = NULL,
      started_at = ?,
      history = '[]',
      updated_at = ?
    WHERE id = ?
  `).run(
    initState.servingTeam,
    initState.servingPlayerId,
    initState.receivingPlayerId,
    initState.serviceCourt,
    JSON.stringify(initState.teamAPositions),
    JSON.stringify(initState.teamBPositions),
    initState.courtSideA,
    tossData.tossWinner || "A",
    tossData.tossChoice || "serve",
    now,
    now,
    id
  );

  // Keep timer stopped upon toss setup until umpire explicitly starts it
  if (match.timer_enabled) {
    db.prepare(`
      UPDATE matches SET
        timer_status = 'stopped',
        timer_start_ts = NULL,
        timer_remaining_seconds = timer_duration_seconds
      WHERE id = ?
    `).run(id);
  }

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

/**
 * Score point for team 'A' or 'B'
 */
export function addPoint(id, winningTeam, faultReason = null) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error("Match not found");
  if (match.status !== "live") throw new Error("Match is not currently live.");

  const teamAPlayers = [match.team_a_player1, match.team_a_player2].filter(Boolean);
  const teamBPlayers = [match.team_b_player1, match.team_b_player2].filter(Boolean);

  const currentState = {
    scoreA: match.score_a,
    scoreB: match.score_b,
    servingTeam: match.serving_team,
    servingPlayerId: match.serving_player_id,
    receivingPlayerId: match.receiving_player_id,
    serviceCourt: match.service_court,
    teamAPositions: match.team_a_positions,
    teamBPositions: match.team_b_positions,
    courtSideA: match.court_side_a,
    isGameOver: match.status === "completed",
    winner: match.winner_team,
    history: match.history,
  };

  const nextState = scorePoint(currentState, winningTeam, match.category, teamAPlayers, teamBPlayers, faultReason);

  const now = new Date().toISOString();
  let status = match.status;
  let winnerTeam = null;
  let winnerName = null;
  let completedAt = match.completed_at;

  const isSuddenDeath = match.timer_mode === "SUDDEN_DEATH" || Boolean(match.is_sudden_death);
  let completionReason = null;

  if (isSuddenDeath) {
    // In sudden death: the very first point awarded immediately wins the match
    status = "completed";
    winnerTeam = winningTeam;
    winnerName = winnerTeam === "A" ? match.team_a_name : match.team_b_name;
    completedAt = now;
    completionReason = "SUDDEN_DEATH";
  } else if (nextState.isGameOver) {
    status = "completed";
    winnerTeam = nextState.winner;
    winnerName = winnerTeam === "A" ? match.team_a_name : match.team_b_name;
    completedAt = now;
    completionReason = "NORMAL_SCORING";
  }

  const isConcluded = Boolean(winnerTeam);

  db.prepare(`
    UPDATE matches SET
      score_a = ?,
      score_b = ?,
      serving_team = ?,
      serving_player_id = ?,
      receiving_player_id = ?,
      service_court = ?,
      team_a_positions = ?,
      team_b_positions = ?,
      history = ?,
      status = ?,
      winner_team = ?,
      winner_name = ?,
      completed_at = ?,
      completion_reason = ?,
      timer_status = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    nextState.scoreA,
    nextState.scoreB,
    nextState.servingTeam,
    nextState.servingPlayerId,
    nextState.receivingPlayerId,
    nextState.serviceCourt,
    JSON.stringify(nextState.teamAPositions),
    JSON.stringify(nextState.teamBPositions),
    JSON.stringify(nextState.history),
    status,
    winnerTeam,
    winnerName,
    completedAt,
    completionReason,
    isConcluded ? "stopped" : match.timer_status,
    now,
    id
  );

  // If game finished, advance knockout progression and update tournament points!
  if (isConcluded) {
    handleMatchCompletion(match, winnerTeam, winnerName, nextState.scoreA, nextState.scoreB);
  }

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

/**
 * Undo Last Score Event
 */
export function undoPoint(id) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error("Match not found");

  const currentState = {
    scoreA: match.score_a,
    scoreB: match.score_b,
    servingTeam: match.serving_team,
    servingPlayerId: match.serving_player_id,
    receivingPlayerId: match.receiving_player_id,
    serviceCourt: match.service_court,
    teamAPositions: match.team_a_positions,
    teamBPositions: match.team_b_positions,
    courtSideA: match.court_side_a,
    isGameOver: match.status === "completed",
    winner: match.winner_team,
    history: match.history,
  };

  const undoneState = undoLastPoint(currentState);
  const now = new Date().toISOString();

  const isSuddenDeath = match.timer_mode === "SUDDEN_DEATH" || Boolean(match.is_sudden_death);

  // If match was completed and we undo the winning point, revive it to live!
  let status = undoneState.isGameOver ? "completed" : "live";
  let winnerTeam = undoneState.winner;
  let winnerName = winnerTeam ? (winnerTeam === "A" ? match.team_a_name : match.team_b_name) : null;
  let completionReason = undoneState.isGameOver ? match.completion_reason : null;

  if (isSuddenDeath) {
    status = "live";
    winnerTeam = null;
    winnerName = null;
    completionReason = null;
  }

  db.prepare(`
    UPDATE matches SET
      score_a = ?,
      score_b = ?,
      serving_team = ?,
      serving_player_id = ?,
      receiving_player_id = ?,
      service_court = ?,
      team_a_positions = ?,
      team_b_positions = ?,
      history = ?,
      status = ?,
      winner_team = ?,
      winner_name = ?,
      completed_at = ?,
      completion_reason = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    undoneState.scoreA,
    undoneState.scoreB,
    undoneState.servingTeam,
    undoneState.servingPlayerId,
    undoneState.receivingPlayerId,
    undoneState.serviceCourt,
    JSON.stringify(undoneState.teamAPositions),
    JSON.stringify(undoneState.teamBPositions),
    JSON.stringify(undoneState.history),
    status,
    winnerTeam,
    winnerName,
    winnerTeam ? match.completed_at : null,
    completionReason,
    now,
    id
  );

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

/**
 * Record LET / Replay
 */
export function letPoint(id) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error("Match not found");

  const currentState = {
    scoreA: match.score_a,
    scoreB: match.score_b,
    servingTeam: match.serving_team,
    servingPlayerId: match.serving_player_id,
    receivingPlayerId: match.receiving_player_id,
    serviceCourt: match.service_court,
    teamAPositions: match.team_a_positions,
    teamBPositions: match.team_b_positions,
    courtSideA: match.court_side_a,
    isGameOver: match.status === "completed",
    winner: match.winner_team,
    history: match.history,
  };

  const letState = recordLet(currentState);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE matches SET history = ?, updated_at = ? WHERE id = ?
  `).run(JSON.stringify(letState.history), now, id);

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

/**
 * Set Match Status (pause, resume, end match manually, cancel)
 */
export function setMatchStatus(id, newStatus) {
  const db = getDb();
  const match = getMatch(id);
  if (!match) throw new Error("Match not found");

  const now = new Date().toISOString();
  let winnerTeam = match.winner_team;
  let winnerName = match.winner_name;
  let completedAt = match.completed_at;

  if (newStatus === "completed" && !winnerTeam) {
    // Determine winner based on current score
    winnerTeam = match.score_a > match.score_b ? "A" : "B";
    winnerName = winnerTeam === "A" ? match.team_a_name : match.team_b_name;
    completedAt = now;
    handleMatchCompletion(match, winnerTeam, winnerName, match.score_a, match.score_b);
  }

  db.prepare(`
    UPDATE matches SET
      status = ?, winner_team = ?, winner_name = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, winnerTeam, winnerName, completedAt, now, id);

  const updated = getMatch(id);
  realtimeEmitter.emit("match_update", updated);
  return updated;
}

export function deleteMatch(id) {
  const db = getDb();
  db.prepare("DELETE FROM matches WHERE id = ?").run(id);
  realtimeEmitter.emit("match_update", { id, deleted: true });

  // Sync to database if backend service is available
  const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.BACKEND_URL || "http://localhost:5050";
  fetch(`${backendUrl}/api/matches/${id}`, { method: "DELETE" }).catch(() => {});

  return { success: true };
}

/**
 * Handles Knockout Bracket Progression & Tournament Points Update
 */
function handleMatchCompletion(match, winnerTeam, winnerName, scoreA, scoreB) {
  const db = getDb();
  const settings = getSettings();

  // 1. Advance winner to next round match slot if configured
  if (match.next_match_id && match.next_match_slot) {
    const nextMatch = db.prepare("SELECT * FROM matches WHERE id = ?").get(match.next_match_id);
    if (nextMatch) {
      const isWinnerA = winnerTeam === "A";
      const winnerId = isWinnerA ? match.team_a_id : match.team_b_id;
      const winnerP1 = isWinnerA ? match.team_a_player1_id : match.team_b_player1_id;
      const winnerP2 = isWinnerA ? match.team_a_player2_id : match.team_b_player2_id;

      if (match.next_match_slot === "A") {
        db.prepare(`
          UPDATE matches SET
            team_a_id = ?, team_a_name = ?, team_a_player1_id = ?, team_a_player2_id = ?, updated_at = ?
          WHERE id = ?
        `).run(winnerId, winnerName, winnerP1, winnerP2, new Date().toISOString(), match.next_match_id);
      } else {
        db.prepare(`
          UPDATE matches SET
            team_b_id = ?, team_b_name = ?, team_b_player1_id = ?, team_b_player2_id = ?, updated_at = ?
          WHERE id = ?
        `).run(winnerId, winnerName, winnerP1, winnerP2, new Date().toISOString(), match.next_match_id);
      }
      const updatedNext = getMatch(match.next_match_id);
      realtimeEmitter.emit("match_update", updatedNext);
    }
  }

  // 2. Update Tournament Points
  const winPoints = settings?.points_per_win || 3;
  const partPoints = settings?.points_per_participation || 1;
  const isDoubles = isDoublesCategory(match.category);

  const isWinnerA = winnerTeam === "A";
  const pointsA = (isWinnerA ? winPoints : 0) + partPoints;
  const pointsB = (!isWinnerA ? winPoints : 0) + partPoints;

  // Record for participant A
  recordParticipantMatchPoints(
    isDoubles ? "team" : "player",
    match.team_a_id || match.team_a_player1_id,
    match.team_a_name,
    match.category,
    isWinnerA,
    scoreA,
    scoreB,
    pointsA
  );

  // Record for participant B
  recordParticipantMatchPoints(
    isDoubles ? "team" : "player",
    match.team_b_id || match.team_b_player1_id,
    match.team_b_name,
    match.category,
    !isWinnerA,
    scoreB,
    scoreA,
    pointsB
  );

  recalculateRanks();
  realtimeEmitter.emit("points_update", {});
}

function recordParticipantMatchPoints(entityType, entityId, entityName, category, won, scored, conceded, ptsAwarded) {
  const db = getDb();
  const existing = db.prepare(`
    SELECT * FROM tournament_points
    WHERE entity_id = ? AND category = ?
  `).get(entityId, category);

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE tournament_points SET
        matches_played = matches_played + 1,
        matches_won = matches_won + ?,
        matches_lost = matches_lost + ?,
        points_scored = points_scored + ?,
        points_conceded = points_conceded + ?,
        total_tournament_points = total_tournament_points + ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      won ? 1 : 0,
      won ? 0 : 1,
      scored,
      conceded,
      ptsAwarded,
      now,
      existing.id
    );
  } else {
    const id = `pts-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    db.prepare(`
      INSERT INTO tournament_points (
        id, entity_type, entity_id, entity_name, category,
        matches_played, matches_won, matches_lost, points_scored, points_conceded,
        total_tournament_points, rank, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, entityType, entityId, entityName, category,
      won ? 1 : 0, won ? 0 : 1, scored, conceded, ptsAwarded, now
    );
  }

  // Points history log
  const logId = `log-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
  db.prepare(`
    INSERT INTO points_history (id, entity_type, entity_id, entity_name, category, points_delta, reason, adjusted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'System / Match Engine', ?)
  `).run(
    logId, entityType, entityId, entityName, category, ptsAwarded,
    won ? "Match Win + Participation" : "Match Participation", now
  );

  // Direct entity stats update for player or team
  try {
    if (entityType === "player") {
      db.prepare(`
        UPDATE players SET
          matches_played = COALESCE(matches_played, 0) + 1,
          matches_won = COALESCE(matches_won, 0) + ?,
          matches_lost = COALESCE(matches_lost, 0) + ?,
          points_scored = COALESCE(points_scored, 0) + ?,
          points_conceded = COALESCE(points_conceded, 0) + ?,
          tournament_points = COALESCE(tournament_points, 0) + ?,
          win_rate = ROUND((CAST(COALESCE(matches_won, 0) + ? AS FLOAT) / (COALESCE(matches_played, 0) + 1)) * 100),
          updated_at = ?
        WHERE id = ? OR player_id = ?
      `).run(won ? 1 : 0, won ? 0 : 1, scored, conceded, ptsAwarded, won ? 1 : 0, now, entityId, entityId);
    } else if (entityType === "team") {
      db.prepare(`
        UPDATE teams SET
          matches_played = COALESCE(matches_played, 0) + 1,
          matches_won = COALESCE(matches_won, 0) + ?,
          matches_lost = COALESCE(matches_lost, 0) + ?,
          points_scored = COALESCE(points_scored, 0) + ?,
          points_conceded = COALESCE(points_conceded, 0) + ?,
          tournament_points = COALESCE(tournament_points, 0) + ?,
          win_rate = ROUND((CAST(COALESCE(matches_won, 0) + ? AS FLOAT) / (COALESCE(matches_played, 0) + 1)) * 100),
          updated_at = ?
        WHERE id = ?
      `).run(won ? 1 : 0, won ? 0 : 1, scored, conceded, ptsAwarded, won ? 1 : 0, now, entityId);

      const tm = db.prepare("SELECT player1_id, player2_id FROM teams WHERE id = ?").get(entityId);
      if (tm) {
        if (tm.player1_id) {
          db.prepare(`
            UPDATE players SET
              matches_played = COALESCE(matches_played, 0) + 1,
              matches_won = COALESCE(matches_won, 0) + ?,
              matches_lost = COALESCE(matches_lost, 0) + ?,
              points_scored = COALESCE(points_scored, 0) + ?,
              points_conceded = COALESCE(points_conceded, 0) + ?,
              tournament_points = COALESCE(tournament_points, 0) + ?,
              win_rate = ROUND((CAST(COALESCE(matches_won, 0) + ? AS FLOAT) / (COALESCE(matches_played, 0) + 1)) * 100),
              updated_at = ?
            WHERE id = ? OR player_id = ?
          `).run(won ? 1 : 0, won ? 0 : 1, scored, conceded, ptsAwarded, won ? 1 : 0, now, tm.player1_id, tm.player1_id);
        }
        if (tm.player2_id) {
          db.prepare(`
            UPDATE players SET
              matches_played = COALESCE(matches_played, 0) + 1,
              matches_won = COALESCE(matches_won, 0) + ?,
              matches_lost = COALESCE(matches_lost, 0) + ?,
              points_scored = COALESCE(points_scored, 0) + ?,
              points_conceded = COALESCE(points_conceded, 0) + ?,
              tournament_points = COALESCE(tournament_points, 0) + ?,
              win_rate = ROUND((CAST(COALESCE(matches_won, 0) + ? AS FLOAT) / (COALESCE(matches_played, 0) + 1)) * 100),
              updated_at = ?
            WHERE id = ? OR player_id = ?
          `).run(won ? 1 : 0, won ? 0 : 1, scored, conceded, ptsAwarded, won ? 1 : 0, now, tm.player2_id, tm.player2_id);
        }
      }
    }
  } catch (e) {
    console.error("Direct entity update error in SQLite:", e);
  }
}

function recalculateRanks() {
  const db = getDb();
  const categories = [
    "Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles", "All"
  ];

  for (const cat of categories) {
    let rows;
    if (cat === "All") {
      rows = db.prepare("SELECT * FROM tournament_points ORDER BY total_tournament_points DESC, matches_won DESC, (points_scored - points_conceded) DESC").all();
    } else {
      rows = db.prepare("SELECT * FROM tournament_points WHERE category = ? ORDER BY total_tournament_points DESC, matches_won DESC, (points_scored - points_conceded) DESC").all(cat);
    }

    let rank = 1;
    for (const r of rows) {
      db.prepare("UPDATE tournament_points SET rank = ? WHERE id = ?").run(rank++, r.id);
    }
  }
}

// ==========================================
// TOURNAMENT POINTS & LEADERBOARD
// ==========================================

export function getLeaderboard({ category = "", entityType = "" } = {}) {
  const db = getDb();
  let query = "SELECT * FROM tournament_points WHERE 1=1";
  const params = [];

  if (category && category !== "All") {
    query += " AND category = ?";
    params.push(category);
  }
  if (entityType && entityType !== "both") {
    query += " AND entity_type = ?";
    params.push(entityType);
  }

  query += " ORDER BY rank ASC, total_tournament_points DESC, matches_won DESC";
  return db.prepare(query).all(...params);
}

export function adjustManualPoints({ entityId, entityType, entityName, category, delta, reason, adjustedBy = "Admin" }) {
  const db = getDb();
  const numDelta = Number(delta);
  if (!numDelta || isNaN(numDelta)) throw new Error("Valid points delta required");
  if (!reason) throw new Error("Adjustment reason is required");

  const existing = db.prepare("SELECT * FROM tournament_points WHERE entity_id = ? AND category = ?").get(entityId, category);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE tournament_points SET
        total_tournament_points = total_tournament_points + ?,
        updated_at = ?
      WHERE id = ?
    `).run(numDelta, now, existing.id);
  } else {
    const id = `pts-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO tournament_points (
        id, entity_type, entity_id, entity_name, category,
        matches_played, matches_won, matches_lost, points_scored, points_conceded,
        total_tournament_points, rank, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, 1, ?)
    `).run(id, entityType || "player", entityId, entityName || entityId, category, numDelta, now);
  }

  // Insert log
  const logId = `log-${Date.now().toString(36)}`;
  db.prepare(`
    INSERT INTO points_history (id, entity_type, entity_id, entity_name, category, points_delta, reason, adjusted_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(logId, entityType || "player", entityId, entityName || entityId, category, numDelta, reason, adjustedBy, now);

  recalculateRanks();
  realtimeEmitter.emit("points_update", {});
  return { success: true };
}

export function getPointsHistory() {
  const db = getDb();
  return db.prepare("SELECT * FROM points_history ORDER BY created_at DESC LIMIT 100").all();
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export function verifyAdminCredentials(email, password) {
  const db = getDb();
  const admin = db.prepare("SELECT * FROM administrators WHERE email = ? AND password = ?").get(email, password);
  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}
