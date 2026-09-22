/**
 * @file src/services/sqliteAuthService.ts
 * Standalone Offline SQLite Authentication Engine.
 * 
 * Powered by WebAssembly SQLite (sql.js) with zero external network dependencies.
 * All user credentials, salted SHA-256 hashes, sessions, and audit logs are stored in a
 * genuine SQLite database file, auto-persisted to browser IndexedDB storage.
 */

import initSqlJsWasm, { Database, SqlJsStatic } from 'sql.js';
// @ts-ignore sql-asm is packaged in sql.js/dist
import initSqlJsAsm from 'sql.js/dist/sql-asm.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { AuthUser, AuthAuditLog, SqliteTableInfo } from '../types';
import { saveSqliteBuffer, loadSqliteBuffer, deleteSqliteDatabase } from './sqliteStorage';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let initPromise: Promise<void> | null = null;

async function loadSqlJsEngine(): Promise<SqlJsStatic> {
  // Attempt 1: Fetch WASM binary and verify magic bytes (\0asm)
  try {
    const res = await fetch(sqlWasmUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Validate WebAssembly magic header: 0x00 0x61 0x73 0x6d (\0asm)
      if (
        bytes.length > 4 &&
        bytes[0] === 0x00 &&
        bytes[1] === 0x61 &&
        bytes[2] === 0x73 &&
        bytes[3] === 0x6d
      ) {
        console.log('[SQLite Engine] Valid WebAssembly binary loaded, initializing WASM SQLite...');
        const sqlInstance = await initSqlJsWasm({
          wasmBinary: buffer,
        });
        if (sqlInstance && sqlInstance.Database) {
          return sqlInstance;
        }
      } else {
        console.warn(
          '[SQLite Engine] Non-WASM response received for wasm URL (magic word mismatch). Falling back to pure offline JS/asm engine.'
        );
      }
    }
  } catch (wasmErr) {
    console.warn('[SQLite Engine] WASM instantiation failed, falling back to asm.js engine:', wasmErr);
  }

  // Attempt 2: Pure JavaScript asm.js SQLite engine (zero network requests, works in all iframes)
  console.log('[SQLite Engine] Initializing resilient offline JS/asm SQLite engine...');
  const asmInitializer =
    typeof initSqlJsAsm === 'function'
      ? initSqlJsAsm
      : (initSqlJsAsm as { default?: () => Promise<SqlJsStatic> })?.default;

  if (typeof asmInitializer === 'function') {
    const asmInstance = await asmInitializer();
    if (asmInstance && asmInstance.Database) {
      return asmInstance;
    }
  }

  // Attempt 3: Direct initSqlJsWasm with fallback
  return await initSqlJsWasm();
}

// Cryptographic helpers
function generateRandomHex(bytesCount = 16): string {
  const bytes = new Uint8Array(bytesCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '::AXPERT_SQLITE_SALT::' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

class SqliteAuthService {
  private isInitialized = false;

  public async initialize(): Promise<{ success: boolean; userCount: number }> {
    if (this.isInitialized && db) {
      return { success: true, userCount: this.getUserCount() };
    }

    if (initPromise) {
      await initPromise;
      return { success: true, userCount: this.getUserCount() };
    }

    initPromise = (async () => {
      try {
        if (!SQL) {
          SQL = await loadSqlJsEngine();
        }

        // Attempt to load existing SQLite database from local IndexedDB
        const existingBytes = await loadSqliteBuffer();
        if (existingBytes && existingBytes.length > 0) {
          try {
            db = new SQL.Database(existingBytes);
            console.log('[SQLite Engine] Successfully restored database from local storage.');
          } catch (e) {
            console.warn('[SQLite Engine] Corrupted database bytes, initializing fresh database:', e);
            db = new SQL.Database();
          }
        } else {
          db = new SQL.Database();
          console.log('[SQLite Engine] Fresh in-memory SQLite database initialized.');
        }

        this.applySchema();
        await this.seedDefaultAdminIfEmpty();
        await this.persist();
        this.isInitialized = true;
      } catch (err) {
        console.error('[SQLite Engine] Initialization failed:', err);
        throw err;
      }
    })();

    await initPromise;
    return { success: true, userCount: this.getUserCount() };
  }

  private applySchema(): void {
    if (!db) return;

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT DEFAULT 'operator',
        full_name TEXT,
        created_at TEXT NOT NULL,
        last_login TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        ip_address TEXT DEFAULT '127.0.0.1 (Offline Local)'
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    `);
  }

  private async seedDefaultAdminIfEmpty(): Promise<void> {
    if (!db) return;

    const count = this.getUserCount();
    if (count === 0) {
      const salt = generateRandomHex(16);
      const passwordHash = await hashPassword('AdminPass123!', salt);
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO users (id, email, username, password_hash, salt, role, full_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        'usr_admin_default',
        'admin@axpert.local',
        'admin',
        passwordHash,
        salt,
        'admin',
        'System Administrator',
        now
      ]);
      stmt.free();

      this.logAudit({
        userId: 'usr_admin_default',
        email: 'admin@axpert.local',
        eventType: 'DB_INIT',
        description: 'SQLite database initialized with default offline administrator account (admin@axpert.local).'
      });
    }
  }

  private async persist(): Promise<void> {
    if (!db) return;
    try {
      const data = db.export();
      await saveSqliteBuffer(data);
    } catch (err) {
      console.error('[SQLite Engine] Database persist failed:', err);
    }
  }

  public getUserCount(): number {
    if (!db) return 0;
    try {
      const res = db.exec('SELECT COUNT(*) as count FROM users');
      if (res.length > 0 && res[0].values.length > 0) {
        return Number(res[0].values[0][0]) || 0;
      }
    } catch (err) {
      console.warn('[SQLite Engine] Error getting user count:', err);
    }
    return 0;
  }

  public async register(params: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role?: 'admin' | 'operator' | 'analyst';
  }): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    await this.initialize();
    if (!db) return { success: false, error: 'SQLite database not ready' };

    const username = params.username.trim();
    const email = params.email.trim().toLowerCase();
    const fullName = params.fullName?.trim() || username;
    const role = params.role || 'operator';

    // Basic validation
    if (!username || username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email address' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Check duplicate email
    const emailCheckStmt = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?)');
    emailCheckStmt.bind([email]);
    if (emailCheckStmt.step()) {
      emailCheckStmt.free();
      return { success: false, error: 'An account with this email address already exists' };
    }
    emailCheckStmt.free();

    // Check duplicate username
    const usernameCheckStmt = db.prepare('SELECT id FROM users WHERE lower(username) = lower(?)');
    usernameCheckStmt.bind([username]);
    if (usernameCheckStmt.step()) {
      usernameCheckStmt.free();
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }
    usernameCheckStmt.free();

    // Hash password with salt
    const salt = generateRandomHex(16);
    const passwordHash = await hashPassword(params.password, salt);
    const userId = 'usr_' + generateRandomHex(8);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (id, email, username, password_hash, salt, role, full_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run([userId, email, username, passwordHash, salt, role, fullName, now]);
    insertStmt.free();

    this.logAudit({
      userId,
      email,
      eventType: 'REGISTER',
      description: `New user account created: @${username} (${email}) with role [${role}].`
    });

    await this.persist();

    const createdUser: AuthUser = {
      id: userId,
      email,
      username,
      fullName,
      role,
      createdAt: now
    };

    return { success: true, user: createdUser };
  }

  public async login(
    emailOrUsername: string,
    passwordPlain: string
  ): Promise<{ success: boolean; user?: AuthUser; sessionToken?: string; error?: string }> {
    await this.initialize();
    if (!db) return { success: false, error: 'SQLite database not ready' };

    const query = emailOrUsername.trim();
    if (!query || !passwordPlain) {
      return { success: false, error: 'Please enter both identifier and password' };
    }

    const stmt = db.prepare(`
      SELECT id, email, username, password_hash, salt, role, full_name, created_at, last_login
      FROM users
      WHERE lower(email) = lower(?) OR lower(username) = lower(?)
    `);
    stmt.bind([query, query]);

    if (!stmt.step()) {
      stmt.free();
      this.logAudit({
        email: query,
        eventType: 'LOGIN_FAILURE',
        description: `Failed login attempt for identifier: "${query}". Account not found.`
      });
      return { success: false, error: 'Invalid credentials. Please verify your email or password.' };
    }

    const row = stmt.getAsObject();
    stmt.free();

    const userId = String(row.id);
    const salt = String(row.salt);
    const storedHash = String(row.password_hash);
    const computedHash = await hashPassword(passwordPlain, salt);

    if (computedHash !== storedHash) {
      this.logAudit({
        userId,
        email: String(row.email),
        eventType: 'LOGIN_FAILURE',
        description: `Failed login attempt for user "${row.username}". Password mismatch.`
      });
      return { success: false, error: 'Invalid credentials. Password does not match.' };
    }

    // Update last_login
    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
    updateStmt.run([now, userId]);
    updateStmt.free();

    // Create session token
    const sessionToken = 'ses_' + generateRandomHex(24);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const sessionStmt = db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    sessionStmt.run([sessionToken, userId, now, expiresAt]);
    sessionStmt.free();

    this.logAudit({
      userId,
      email: String(row.email),
      eventType: 'LOGIN_SUCCESS',
      description: `User "${row.username}" successfully authenticated offline via SQLite.`
    });

    await this.persist();

    const user: AuthUser = {
      id: userId,
      email: String(row.email),
      username: String(row.username),
      fullName: String(row.full_name || row.username),
      role: (row.role as 'admin' | 'operator' | 'analyst') || 'operator',
      createdAt: String(row.created_at),
      lastLogin: now
    };

    return { success: true, user, sessionToken };
  }

  public async validateSession(
    token: string
  ): Promise<{ valid: boolean; user?: AuthUser }> {
    await this.initialize();
    if (!db || !token) return { valid: false };

    const stmt = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.email, u.username, u.role, u.full_name, u.created_at, u.last_login
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `);
    stmt.bind([token]);

    if (!stmt.step()) {
      stmt.free();
      return { valid: false };
    }

    const row = stmt.getAsObject();
    stmt.free();

    const expiresAt = new Date(String(row.expires_at)).getTime();
    if (Date.now() > expiresAt) {
      // Session expired, remove
      this.logout(token);
      return { valid: false };
    }

    const user: AuthUser = {
      id: String(row.id),
      email: String(row.email),
      username: String(row.username),
      fullName: String(row.full_name || row.username),
      role: (row.role as 'admin' | 'operator' | 'analyst') || 'operator',
      createdAt: String(row.created_at),
      lastLogin: row.last_login ? String(row.last_login) : undefined
    };

    return { valid: true, user };
  }

  public async logout(token: string): Promise<void> {
    if (!db || !token) return;
    try {
      const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
      stmt.run([token]);
      stmt.free();
      this.logAudit({
        eventType: 'LOGOUT',
        description: 'Session invalidated and closed.'
      });
      await this.persist();
    } catch (err) {
      console.warn('[SQLite Engine] Error during logout:', err);
    }
  }

  public logAudit(entry: {
    userId?: string;
    email?: string;
    eventType: AuthAuditLog['eventType'];
    description: string;
  }): void {
    if (!db) return;
    try {
      const id = 'log_' + generateRandomHex(8);
      const timestamp = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO auth_audit_logs (id, user_id, email, event_type, description, timestamp, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        id,
        entry.userId || null,
        entry.email || null,
        entry.eventType,
        entry.description,
        timestamp,
        '127.0.0.1 (Offline Local)'
      ]);
      stmt.free();
    } catch (err) {
      console.warn('[SQLite Engine] Error inserting audit log:', err);
    }
  }

  public getAuditLogs(limit = 50): AuthAuditLog[] {
    if (!db) return [];
    try {
      const stmt = db.prepare(`
        SELECT id, user_id, email, event_type, description, timestamp, ip_address
        FROM auth_audit_logs
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      stmt.bind([limit]);

      const logs: AuthAuditLog[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        logs.push({
          id: String(row.id),
          userId: row.user_id ? String(row.user_id) : undefined,
          email: row.email ? String(row.email) : undefined,
          eventType: row.event_type as AuthAuditLog['eventType'],
          description: String(row.description),
          timestamp: String(row.timestamp),
          ipAddress: String(row.ip_address || '127.0.0.1')
        });
      }
      stmt.free();
      return logs;
    } catch (err) {
      console.warn('[SQLite Engine] Error getting audit logs:', err);
      return [];
    }
  }

  public getTableInfo(): SqliteTableInfo[] {
    if (!db) return [];
    try {
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (tablesRes.length === 0) return [];

      const tables: SqliteTableInfo[] = [];
      for (const row of tablesRes[0].values) {
        const tableName = String(row[0]);
        let rowCount = 0;
        const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
        if (countRes.length > 0 && countRes[0].values.length > 0) {
          rowCount = Number(countRes[0].values[0][0]) || 0;
        }

        const colsRes = db.exec(`PRAGMA table_info("${tableName}")`);
        const columns: string[] = [];
        if (colsRes.length > 0) {
          for (const colRow of colsRes[0].values) {
            columns.push(String(colRow[1]) + ` (${colRow[2]})`);
          }
        }

        tables.push({
          name: tableName,
          rowCount,
          columns
        });
      }
      return tables;
    } catch (err) {
      console.warn('[SQLite Engine] Error querying table info:', err);
      return [];
    }
  }

  public executeRawSql(sql: string): { columns: string[]; values: (string | number | null)[][] } | { error: string } {
    if (!db) return { error: 'Database not initialized' };
    try {
      const res = db.exec(sql);
      if (res.length === 0) {
        return { columns: [], values: [] };
      }
      return {
        columns: res[0].columns,
        values: res[0].values as (string | number | null)[][]
      };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  public exportDatabaseBlob(): { blob: Blob; fileName: string; size: number } {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    const data = db.export();
    const blob = new Blob([data as unknown as BlobPart], { type: 'application/x-sqlite3' });
    const fileName = `axpert_auth_${new Date().toISOString().slice(0, 10)}.sqlite`;
    return {
      blob,
      fileName,
      size: data.byteLength
    };
  }

  public async resetDatabase(): Promise<void> {
    if (db) {
      db.close();
      db = null;
    }
    await deleteSqliteDatabase();
    this.isInitialized = false;
    initPromise = null;
    await this.initialize();
  }
}

export const sqliteAuth = new SqliteAuthService();
