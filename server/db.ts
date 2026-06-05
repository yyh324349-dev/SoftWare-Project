import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'data', 'mozhi.db');

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// 启用 WAL 模式和外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ========== 建表 ==========

db.exec(`
  -- 1. 认证配置（单例）
  CREATE TABLE IF NOT EXISTS auth_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 2. 用户设置（单例）
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    anthropic_key_enc TEXT,
    openai_key_enc TEXT,
    preferred_provider TEXT DEFAULT 'anthropic',
    model TEXT DEFAULT 'claude-sonnet-4-20250514',
    theme TEXT DEFAULT 'light',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 3. 课程
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    style TEXT DEFAULT 'academic',
    format TEXT DEFAULT 'cs61b',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 4. 课程大纲
  CREATE TABLE IF NOT EXISTS syllabus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(course_id, week_number)
  );

  -- 5. 章节讲义
  CREATE TABLE IF NOT EXISTS lectures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    syllabus_id INTEGER REFERENCES syllabus(id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 6. 聊天对话主题
  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    mode TEXT DEFAULT 'tutor',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 7. 聊天消息记录
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 8. 实验
  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    starter_code TEXT,
    test_cases TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 9. 项目
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    milestones TEXT,
    starter_code TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 10. 章节笔记
  CREATE TABLE IF NOT EXISTS topic_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    syllabus_id INTEGER REFERENCES syllabus(id),
    week_number INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(course_id, week_number)
  );

  -- 11. AI 学生画像
  CREATE TABLE IF NOT EXISTS course_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
    summary TEXT,
    strengths TEXT,
    weaknesses TEXT,
    learning_style TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- 12. 证书
  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    issued_at TEXT DEFAULT (datetime('now')),
    course_title TEXT
  );

  -- 13. 学习时长记录
  CREATE TABLE IF NOT EXISTS learning_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_minutes INTEGER,
    activity_type TEXT
  );

  -- 14. 章节完成进度
  CREATE TABLE IF NOT EXISTS lecture_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    syllabus_id INTEGER NOT NULL REFERENCES syllabus(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started',
    completed_at TEXT,
    UNIQUE(course_id, syllabus_id)
  );

  -- 15. 实验文件（多文件支持）
  CREATE TABLE IF NOT EXISTS lab_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_entry INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(lab_id, filename)
  );
`);

// ========== 性能索引 ==========

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_syllabus_course_id ON syllabus(course_id);
  CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
  CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);
  CREATE INDEX IF NOT EXISTS idx_labs_course_id ON labs(course_id);
  CREATE INDEX IF NOT EXISTS idx_projects_course_id ON projects(course_id);
  CREATE INDEX IF NOT EXISTS idx_topic_notes_course_id ON topic_notes(course_id);
  CREATE INDEX IF NOT EXISTS idx_learning_sessions_course_id ON learning_sessions(course_id);
  CREATE INDEX IF NOT EXISTS idx_lecture_progress_course_syllabus ON lecture_progress(course_id, syllabus_id);
`);

// 初始化 settings 单例行（如果不存在）
const settingsExists = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!settingsExists) {
  db.prepare('INSERT INTO settings (id) VALUES (1)').run();
}

// 迁移：为 settings 表添加 base_url 列（如果不存在）
try {
  db.exec('ALTER TABLE settings ADD COLUMN base_url TEXT DEFAULT \'\'');
} catch {
  // 列已存在，忽略
}

// 迁移：为 certificates 表添加 grade 列（如果不存在）
try {
  db.exec('ALTER TABLE certificates ADD COLUMN grade TEXT DEFAULT \'\'');
} catch {
  // 列已存在，忽略
}

console.log(`📦 SQLite database initialized at ${DB_PATH}`);

export default db;
