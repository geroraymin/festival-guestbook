-- 부스 테이블
CREATE TABLE IF NOT EXISTS booths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 방명록 엔트리 테이블
CREATE TABLE IF NOT EXISTS guestbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booth_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('남성', '여성')),
    school_level TEXT NOT NULL CHECK (school_level IN ('초등', '중등', '고등', '기타')),
    birth_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE CASCADE
);

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'booth_operator' CHECK (role IN ('admin', 'booth_operator')),
    booth_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booth_id) REFERENCES booths (id) ON DELETE SET NULL
);

-- 기본 부스 데이터 삽입
INSERT OR IGNORE INTO booths (name) VALUES 
    ('AI 체험 부스'),
    ('VR 게임존'),
    ('코딩 교실'),
    ('로봇 만들기');

-- 기본 관리자 계정 (admin/admin123)
INSERT OR IGNORE INTO admin_users (username, password_hash, role) VALUES 
    ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guestbook_booth_id ON guestbook_entries(booth_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);
