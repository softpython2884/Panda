
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PANDA_ADMIN_EMAIL } from '@/lib/schemas'; // Import admin email

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
    db.exec(
      'CREATE TABLE IF NOT EXISTS users (\n' +
      '  id TEXT PRIMARY KEY,\n' +
      '  email TEXT UNIQUE NOT NULL,\n' +
      '  password_hash TEXT NOT NULL,\n' +
      '  created_at TEXT DEFAULT CURRENT_TIMESTAMP\n' +
      ');\n' +
      '\n' +
      'CREATE TABLE IF NOT EXISTS services (\n' +
      '  id TEXT PRIMARY KEY,\n' +
      '  user_id TEXT NOT NULL,\n' +
      '  name TEXT NOT NULL,\n' +
      '  description TEXT NOT NULL,\n' +
      '  local_url TEXT, \n' +
      '  public_url TEXT, \n' +
      '  domain TEXT NOT NULL UNIQUE, \n' +
      '  type TEXT NOT NULL, \n' +
      '  created_at TEXT DEFAULT CURRENT_TIMESTAMP,\n' +
      '  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
      ');'
    );
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
      db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN firstName TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN lastName TEXT;');
      console.log("Added username (nullable), firstName, lastName columns to users table.");

      const stmt = db.prepare('UPDATE users SET username = email WHERE username IS NULL');
      stmt.run();
      console.log("Attempted to populate username for existing users using their email as a fallback.");

      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);');
      console.log("Created UNIQUE index on username column.");

    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes('duplicate column name')) {
                 console.warn("One or more columns (username, firstName, lastName) might already exist on users table (v4 migration partial run?).");
            } else if (e.message.includes('UNIQUE constraint failed') && e.message.includes('idx_users_username')) {
                console.error("Failed to create UNIQUE index on username. This means there are duplicate usernames after the update attempt. Manual intervention might be needed.", e);
            } else {
                 console.error("Error during v4 schema migration:", e);
            }
        } else {
            console.error("Unknown error during v4 schema migration:", e);
        }
        if (e instanceof Error && !(e.message.includes('duplicate column name'))) {
            throw e;
        }
    }
    db.pragma('user_version = 4');
    console.log("Database schema upgraded to version 4 for user profiles.");
    schemaVersion = 4;
  }

  if (schemaVersion < 5) {
    try {
      db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'FREE' NOT NULL;");
      console.log("Added role column to users table (migration step for v5).");
      if (PANDA_ADMIN_EMAIL) {
        const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get(PANDA_ADMIN_EMAIL);
        if (adminUser) {
          db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run((adminUser as any).id);
          console.log('User ' + PANDA_ADMIN_EMAIL + ' assigned ADMIN role.');
        } else {
          console.log('Admin email ' + PANDA_ADMIN_EMAIL + ' not found, no user assigned ADMIN role automatically during migration.');
        }
      } else {
        console.log("PANDA_ADMIN_EMAIL not set, no user assigned ADMIN role automatically during migration.");
      }
    } catch (e) {
        if (e instanceof Error && e.message.includes('duplicate column name: role')) {
            console.warn("Column 'role' already exists on users table (v5 migration).");
        } else {
            throw e;
        }
    }
    db.pragma('user_version = 5');
    console.log("Database schema upgraded to version 5 for user roles.");
    schemaVersion = 5;
  }

  if (schemaVersion < 6) {
    try {
      db.exec(
        'CREATE TABLE IF NOT EXISTS api_tokens (\n' +
        '  id TEXT PRIMARY KEY,\n' +
        '  user_id TEXT NOT NULL,\n' +
        '  name TEXT NOT NULL,\n' +
        '  token_prefix TEXT NOT NULL UNIQUE,\n' +
        '  token_hash TEXT NOT NULL UNIQUE,\n' +
        '  scopes TEXT,\n' +
        '  last_used_at DATETIME,\n' +
        '  expires_at DATETIME,\n' +
        '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n' +
        '  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
        ');'
      );
      console.log("Created api_tokens table (migration step for v6).");
    } catch (e) {
      console.error("Error creating api_tokens table:", e);
      throw e;
    }
    db.pragma('user_version = 6');
    console.log("Database schema upgraded to version 6 for API tokens.");
    schemaVersion = 6;
  }

  if (schemaVersion < 7) {
    try {
      db.exec(
        'CREATE TABLE IF NOT EXISTS notifications (\n' +
        '  id TEXT PRIMARY KEY,\n' +
        '  user_id TEXT NOT NULL,\n' +
        '  message TEXT NOT NULL,\n' +
        '  type TEXT DEFAULT \'info\' NOT NULL,\n' +
        '  link TEXT,\n' +
        '  is_read INTEGER DEFAULT 0,\n' +
        '  created_at TEXT DEFAULT CURRENT_TIMESTAMP,\n' +
        '  read_at TEXT,\n' +
        '  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
        ');'
      );
      console.log("Created notifications table (migration step for v7).");
    } catch (e) {
      console.error("Error creating notifications table:", e);
      throw e;
    }
    db.pragma('user_version = 7');
    console.log("Database schema upgraded to version 7 for user notifications.");
    schemaVersion = 7;
  }

  if (schemaVersion < 8) {
    try {
      db.exec(
        'CREATE TABLE IF NOT EXISTS cloud_spaces (\n' +
        '  id TEXT PRIMARY KEY,\n' +
        '  user_id TEXT NOT NULL,\n' +
        '  name TEXT NOT NULL,\n' +
        '  discord_webhook_url TEXT,\n' + // Will store the full webhook URL
        '  discord_channel_id TEXT,\n' +  // Optional: if you want to store channel ID for bot management
        '  created_at TEXT DEFAULT CURRENT_TIMESTAMP,\n' +
        '  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n' +
        ');'
      );
      console.log("Created cloud_spaces table (migration step for v8).");
    } catch (e) {
      console.error("Error creating cloud_spaces table:", e);
      throw e;
    }
    db.pragma('user_version = 8');
    console.log("Database schema upgraded to version 8 for Cloud Spaces.");
    schemaVersion = 8;
  }
}

initializeSchema();

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
