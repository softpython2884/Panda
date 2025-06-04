
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
      // Step 1: Add columns without UNIQUE constraint on username initially
      db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN firstName TEXT;');
      db.exec('ALTER TABLE users ADD COLUMN lastName TEXT;');
      console.log("Added username (nullable), firstName, lastName columns to users table.");

      // Step 2: Populate username for existing users (if any, and if username is NULL)
      // Using email as a fallback. Ensure this logic aligns with your desired uniqueness.
      // Since email is already UNIQUE, this should provide unique usernames for existing users without one.
      const stmt = db.prepare('UPDATE users SET username = email WHERE username IS NULL');
      stmt.run();
      console.log("Attempted to populate username for existing users using their email as a fallback.");

      // Step 3: Create a UNIQUE index on the username column
      // IF NOT EXISTS is good practice in case migration runs multiple times due to partial failure
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);');
      console.log("Created UNIQUE index on username column.");
      
      console.log("Database schema upgraded to version 4 for user profiles (username, firstName, lastName added).");
    } catch (e) {
        // Catch specific errors if needed, e.g., if CREATE UNIQUE INDEX fails due to actual duplicates after update
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
        // Do not re-throw if it's just a "duplicate column" warning from a partial run,
        // but do re-throw for critical errors like failing to create a unique index due to data issues.
        if (e instanceof Error && !(e.message.includes('duplicate column name'))) {
            throw e; // Re-throw critical errors
        }
    }
    db.pragma('user_version = 4');
    schemaVersion = 4;
  }
}

initializeSchema();

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
