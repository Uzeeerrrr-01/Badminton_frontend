-- ====================================================================
-- BADMINTON TOURNAMENT MANAGEMENT PORTAL - SUPABASE POSTGRESQL SCHEMA
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tournament Settings
CREATE TABLE IF NOT EXISTS tournament_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Apex Badminton Open 2026',
  description TEXT DEFAULT 'Premier collegiate & club badminton championship',
  logo_url TEXT,
  venue TEXT DEFAULT 'Center Court Arena',
  number_of_courts INTEGER DEFAULT 4,
  points_per_win INTEGER DEFAULT 3,
  points_per_participation INTEGER DEFAULT 1,
  bonus_sweep_points INTEGER DEFAULT 1,
  ranking_type TEXT DEFAULT 'both', -- 'players', 'teams', 'both'
  scoring_target_points INTEGER DEFAULT 11,
  scoring_deuce_lead INTEGER DEFAULT 2,
  scoring_max_points INTEGER DEFAULT 15,
  timer_duration_seconds INTEGER DEFAULT 0,
  timer_status TEXT DEFAULT 'stopped' CHECK (timer_status IN ('stopped','running','paused')),
  timer_start_ts TIMESTAMPTZ,
  timer_remaining_seconds INTEGER DEFAULT 0,
  timer_sound_enabled BOOLEAN DEFAULT TRUE,


-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'singles' or 'doubles'
  gender_requirement TEXT NOT NULL, -- 'male', 'female', 'any', 'mixed'
  max_participants INTEGER DEFAULT 32,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Players
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT ('PLY-' || substr(uuid_generate_v4()::text, 1, 6)),
  player_id TEXT UNIQUE NOT NULL, -- e.g. PLY-001
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  contact_email TEXT,
  contact_phone TEXT,
  profile_image TEXT,
  registration_status TEXT DEFAULT 'Active' CHECK (registration_status IN ('Active', 'Withdrawn', 'Suspended')),
  eligible_categories TEXT[] DEFAULT ARRAY[]::TEXT[], -- category IDs or names
  timer_duration_seconds INTEGER DEFAULT 0,
  timer_status TEXT DEFAULT 'stopped' CHECK (timer_status IN ('stopped','running','paused')),
  timer_start_ts TIMESTAMPTZ,
  timer_remaining_seconds INTEGER DEFAULT 0,
  timer_sound_enabled BOOLEAN DEFAULT TRUE,


-- 5. Teams (For Doubles and Mixed Doubles)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT ('TEAM-' || substr(uuid_generate_v4()::text, 1, 6)),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  player1_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_team_players UNIQUE(player1_id, player2_id, category)
);

-- 6. Matches
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY DEFAULT ('MTH-' || substr(uuid_generate_v4()::text, 1, 6)),
  category TEXT NOT NULL,
  round TEXT NOT NULL DEFAULT 'Round of 16',
  match_number INTEGER,
  court_number INTEGER DEFAULT 1,
  scheduled_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ready', 'live', 'paused', 'completed', 'cancelled')),
  
  -- Participant A
  team_a_id TEXT, -- team id or player id
  team_a_name TEXT NOT NULL,
  team_a_player1_id TEXT NOT NULL REFERENCES players(id),
  team_a_player2_id TEXT REFERENCES players(id),
  score_a INTEGER DEFAULT 0,
  
  -- Participant B
  team_b_id TEXT, -- team id or player id
  team_b_name TEXT NOT NULL,
  team_b_player1_id TEXT NOT NULL REFERENCES players(id),
  team_b_player2_id TEXT REFERENCES players(id),
  score_b INTEGER DEFAULT 0,
  
  -- Live state
  serving_team TEXT DEFAULT 'A' CHECK (serving_team IN ('A', 'B')),
  serving_player_id TEXT,
  receiving_player_id TEXT,
  service_court TEXT DEFAULT 'right' CHECK (service_court IN ('right', 'left')),
  
  team_a_court_position_right TEXT,
  team_a_court_position_left TEXT,
  team_b_court_position_right TEXT,
  team_b_court_position_left TEXT,
  court_side_a TEXT DEFAULT 'left',
  
  -- Toss details
  toss_winner TEXT,
  toss_choice TEXT,
  
  -- Winner & Progression
  winner_team TEXT,
  winner_name TEXT,
  next_match_id TEXT,
  next_match_slot TEXT, -- 'A' or 'B'
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timer_duration_seconds INTEGER DEFAULT 0,
  timer_status TEXT DEFAULT 'stopped' CHECK (timer_status IN ('stopped','running','paused')),
  timer_start_ts TIMESTAMPTZ,
  timer_remaining_seconds INTEGER DEFAULT 0,
  timer_sound_enabled BOOLEAN DEFAULT TRUE,


-- 7. Match Score Events (History & Undo log)
CREATE TABLE IF NOT EXISTS match_events (
  id TEXT PRIMARY KEY DEFAULT ('EVT-' || substr(uuid_generate_v4()::text, 1, 8)),
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  score_before_a INTEGER NOT NULL,
  score_before_b INTEGER NOT NULL,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'point', 'let', 'undo', etc.
  point_recipient TEXT, -- 'A' or 'B'
  fault_category TEXT, -- fault enum
  fault_reason TEXT, -- description or custom
  custom_reason TEXT,
  serving_team_before TEXT,
  serving_team_after TEXT,
  serving_player_before TEXT,
  serving_player_after TEXT,
  receiving_player_before TEXT,
  receiving_player_after TEXT,
  service_court_before TEXT,
  service_court_after TEXT,
  reversed BOOLEAN DEFAULT FALSE,
  description TEXT,
  snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tournament Points & Leaderboard
CREATE TABLE IF NOT EXISTS tournament_points (
  id TEXT PRIMARY KEY DEFAULT ('PTS-' || substr(uuid_generate_v4()::text, 1, 6)),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('player', 'team')),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_entity_category UNIQUE(entity_type, entity_id, category)
);

-- 9. Points History Log (traceable adjustments)
CREATE TABLE IF NOT EXISTS points_history (
  id TEXT PRIMARY KEY DEFAULT ('LOG-' || substr(uuid_generate_v4()::text, 1, 8)),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  category TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Public can read all tournament data
CREATE POLICY "Public Read Settings" ON tournament_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Players" ON players FOR SELECT USING (true);
CREATE POLICY "Public Read Teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public Read Matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public Read Match Events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Public Read Points" ON tournament_points FOR SELECT USING (true);
CREATE POLICY "Public Read Points History" ON points_history FOR SELECT USING (true);

-- Authenticated Admin can perform all operations
CREATE POLICY "Admin Write Settings" ON tournament_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Players" ON players FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Teams" ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Matches" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Match Events" ON match_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Points" ON tournament_points FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Points History" ON points_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. SUPABASE REALTIME PUBLICATION
-- Enable Realtime listening for live scoreboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_points;
