-- Hapus tabel jika sudah ada (untuk pengembangan/reset)
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS tournaments;

-- Tabel Turnamen
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'MAHAP OPEN 2026',
    bracket_size INTEGER NOT NULL DEFAULT 8,
    layout_mode TEXT NOT NULL DEFAULT 'two-sided',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Tim/Peserta
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    club TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Pertandingan (Bagan)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_index INTEGER NOT NULL,
    match_index INTEGER NOT NULL,
    t1_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    t2_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    loser_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    score1 TEXT,
    score2 TEXT,
    schedule_date TEXT,
    schedule_court TEXT,
    schedule_match_num TEXT,
    UNIQUE(tournament_id, round_index, match_index)
);

-- Kebijakan Keamanan (Row Level Security / RLS)
-- Untuk saat ini kita buat menjadi "Anonim bisa membaca dan menulis" agar mudah diuji.
-- Di versi produksi, Anda harus mengubah kebijakan ini.

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read all" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert all" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update all" ON tournaments FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read all" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert all" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update all" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete all" ON teams FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read all" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert all" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update all" ON matches FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete all" ON matches FOR DELETE USING (true);
