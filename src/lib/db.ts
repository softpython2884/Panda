
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
        local_url TEXT, -- Legacy, will be de-emphasized for frp services
        public_url TEXT, -- For frp, this will be the generated frp URL
        domain TEXT NOT NULL UNIQUE, -- For frp, this will store the 'subdomain' part
        type TEXT NOT NULL, -- For frp, this stores 'tcp', 'http', etc.
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.pragma('user_version = 1');
    console.log("Database schema initialized to version 1.");
    schemaVersion = 1;
  }

  if (schemaVersion < 2) {
    // Add new columns for FrpService integration
    // And adjust existing ones if necessary
    try {
      db.exec('ALTER TABLE services ADD COLUMN local_port INTEGER;');
      db.exec('ALTER TABLE services ADD COLUMN frp_type TEXT;'); // To distinguish from legacy 'type' if needed, or reuse 'type'
      // For simplicity, we'll reuse 'type' for frpType and 'domain' for frp subdomain.
      // 'local_url' becomes optional. 'public_url' is generated for frp.
      console.log("Added local_port and frp_type columns to services table.");
    } catch (e) {
        // Ignore if columns already exist (e.g. during rapid dev iterations)
        if (e instanceof Error && (e.message.includes('duplicate column name: local_port') || e.message.includes('duplicate column name: frp_type'))) {
            console.warn("Columns local_port or frp_type already exist on services table.");
        } else {
            throw e;
        }
    }
    db.pragma('user_version = 2');
    console.log("Database schema upgraded to version 2 for frp integration.");
    schemaVersion = 2;
  }
}

initializeSchema();

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
