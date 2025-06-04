
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'panda_pod.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH, { verbose: console.log });

function initializeSchema() {
  let schemaVersion = 0;
  try {
    const row = db.pragma('user_version', { simple: true });
    if (typeof row === 'number') {
        schemaVersion = row;
    }
  } catch (e) {
    console.warn("Could not read user_version, assuming 0. Error:", e);
  }


  if (schemaVersion < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        local_url TEXT, 
        public_url TEXT, 
        domain TEXT NOT NULL UNIQUE, 
        type TEXT NOT NULL, 
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.pragma('user_version = 1');
    console.log("Database schema initialized to version 1.");
    schemaVersion = 1;
  }

  if (schemaVersion < 2) {
    try {
      db.exec('ALTER TABLE services ADD COLUMN local_port INTEGER;');
      db.exec('ALTER TABLE services ADD COLUMN frp_type TEXT;'); 
      console.log("Added local_port and frp_type columns to services table (migration step for v2).");
    } catch (e) {
        if (e instanceof Error && (e.message.includes('duplicate column name: local_port') || e.message.includes('duplicate column name: frp_type'))) {
            console.warn("Columns local_port or frp_type already exist on services table (v2 migration).");
        } else {
            throw e;
        }
    }
    db.pragma('user_version = 2');
    console.log("Database schema upgraded to version 2 for frp integration.");
    schemaVersion = 2;
  }

  if (schemaVersion < 3) {
    try {
      db.exec('ALTER TABLE services ADD COLUMN remote_port INTEGER;'); 
      db.exec('ALTER TABLE services ADD COLUMN use_encryption BOOLEAN DEFAULT TRUE;');
      db.exec('ALTER TABLE services ADD COLUMN use_compression BOOLEAN DEFAULT FALSE;');
      console.log("Added remote_port, use_encryption, use_compression columns to services table (migration step for v3).");
    } catch (e) {
        if (e instanceof Error && (
            e.message.includes('duplicate column name: remote_port') || 
            e.message.includes('duplicate column name: use_encryption') ||
            e.message.includes('duplicate column name: use_compression')
            )) {
            console.warn("One or more columns (remote_port, use_encryption, use_compression) already exist on services table (v3 migration).");
        } else {
            throw e;
        }
    }
    db.pragma('user_version = 3');
    console.log("Database schema upgraded to version 3 for advanced frp options.");
    schemaVersion = 3;
  }

  if (schemaVersion < 4) {
    try {
      db.exec('ALTER TABLE users ADD COLUMN username TEXT UNIQUE;'); // Will be made NOT NULL later if all existing users have one
      db.exec('ALTER TABLE users ADD COLUMN firstName TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN lastName TEXT;');
      console.log("Added username, firstName, lastName columns to users table (migration step for v4).");
      // If you want username to be NOT NULL and you have existing users,
      // you would first add the column as NULLABLE, populate it for existing users,
      // then alter it to NOT NULL. For a fresh setup, you can add it as NOT NULL directly.
      // For now, let's assume we might need to update existing users or handle nulls initially.
      // A better approach for existing data:
      // 1. ADD COLUMN username TEXT UNIQUE;
      // 2. UPDATE users SET username = email WHERE username IS NULL; (or some other default)
      // 3. (If using SQLite version that supports it, or recreate table) ALTER TABLE users ALTER COLUMN username SET NOT NULL;
      // For simplicity now, username is UNIQUE but can be NULL. Registration will enforce it.
    } catch (e) {
        if (e instanceof Error && (
            e.message.includes('duplicate column name: username') ||
            e.message.includes('duplicate column name: firstName') ||
            e.message.includes('duplicate column name: lastName')
        )) {
             console.warn("One or more columns (username, firstName, lastName) already exist on users table (v4 migration).");
        } else {
            throw e;
        }
    }
    db.pragma('user_version = 4');
    console.log("Database schema upgraded to version 4 for user profiles.");
    schemaVersion = 4;
  }
}

initializeSchema();

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
