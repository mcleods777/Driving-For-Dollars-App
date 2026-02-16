import * as SQLite from 'expo-sqlite';
import { DrivingSession, PropertyLead, AppSettings, DEFAULT_SETTINGS, Coordinate } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('dfd_app.db');
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      distanceMiles REAL DEFAULT 0,
      isActive INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS coordinates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      speed REAL,
      heading REAL,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      photoUri TEXT,
      tags TEXT DEFAULT '[]',
      createdAt INTEGER NOT NULL,
      sessionId TEXT,
      status TEXT DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_coordinates_session ON coordinates(sessionId);
    CREATE INDEX IF NOT EXISTS idx_leads_session ON leads(sessionId);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);
}

// ===== Session Operations =====

export async function createSession(session: DrivingSession): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO sessions (id, startTime, endTime, distanceMiles, isActive) VALUES (?, ?, ?, ?, ?)',
    [session.id, session.startTime, session.endTime, session.distanceMiles, session.isActive ? 1 : 0]
  );
}

export async function updateSession(session: DrivingSession): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE sessions SET endTime = ?, distanceMiles = ?, isActive = ? WHERE id = ?',
    [session.endTime, session.distanceMiles, session.isActive ? 1 : 0, session.id]
  );
}

export async function getSession(id: string): Promise<DrivingSession | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM sessions WHERE id = ?',
    [id]
  );
  if (!row) return null;

  const coordinates = await getCoordinatesForSession(id);
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    distanceMiles: row.distanceMiles,
    isActive: row.isActive === 1,
    coordinates,
  };
}

export async function getAllSessions(): Promise<DrivingSession[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM sessions ORDER BY startTime DESC'
  );

  const sessions: DrivingSession[] = [];
  for (const row of rows) {
    const coordinates = await getCoordinatesForSession(row.id);
    sessions.push({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      distanceMiles: row.distanceMiles,
      isActive: row.isActive === 1,
      coordinates,
    });
  }
  return sessions;
}

export async function getActiveSession(): Promise<DrivingSession | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM sessions WHERE isActive = 1 LIMIT 1'
  );
  if (!row) return null;

  const coordinates = await getCoordinatesForSession(row.id);
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    distanceMiles: row.distanceMiles,
    isActive: true,
    coordinates,
  };
}

export async function deleteSession(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM coordinates WHERE sessionId = ?', [id]);
  await database.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

// ===== Coordinate Operations =====

export async function addCoordinate(sessionId: string, coord: Coordinate): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO coordinates (sessionId, latitude, longitude, timestamp, speed, heading) VALUES (?, ?, ?, ?, ?, ?)',
    [sessionId, coord.latitude, coord.longitude, coord.timestamp, coord.speed ?? null, coord.heading ?? null]
  );
}

export async function addCoordinatesBatch(sessionId: string, coords: Coordinate[]): Promise<void> {
  const database = await getDb();
  for (const coord of coords) {
    await database.runAsync(
      'INSERT INTO coordinates (sessionId, latitude, longitude, timestamp, speed, heading) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, coord.latitude, coord.longitude, coord.timestamp, coord.speed ?? null, coord.heading ?? null]
    );
  }
}

export async function getCoordinatesForSession(sessionId: string): Promise<Coordinate[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM coordinates WHERE sessionId = ? ORDER BY timestamp ASC',
    [sessionId]
  );
  return rows.map((row) => ({
    latitude: row.latitude,
    longitude: row.longitude,
    timestamp: row.timestamp,
    speed: row.speed,
    heading: row.heading,
  }));
}

export async function getAllCoordinates(): Promise<Coordinate[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT DISTINCT latitude, longitude, timestamp, speed, heading FROM coordinates ORDER BY timestamp ASC'
  );
  return rows.map((row) => ({
    latitude: row.latitude,
    longitude: row.longitude,
    timestamp: row.timestamp,
    speed: row.speed,
    heading: row.heading,
  }));
}

// ===== Lead Operations =====

export async function createLead(lead: PropertyLead): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO leads (id, latitude, longitude, address, notes, photoUri, tags, createdAt, sessionId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      lead.id,
      lead.latitude,
      lead.longitude,
      lead.address,
      lead.notes,
      lead.photoUri,
      JSON.stringify(lead.tags),
      lead.createdAt,
      lead.sessionId,
      lead.status,
    ]
  );
}

export async function updateLead(lead: PropertyLead): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE leads SET address = ?, notes = ?, photoUri = ?, tags = ?, status = ? WHERE id = ?',
    [lead.address, lead.notes, lead.photoUri, JSON.stringify(lead.tags), lead.status, lead.id]
  );
}

export async function getAllLeads(): Promise<PropertyLead[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM leads ORDER BY createdAt DESC'
  );
  return rows.map(rowToLead);
}

export async function getLeadsByStatus(status: PropertyLead['status']): Promise<PropertyLead[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM leads WHERE status = ? ORDER BY createdAt DESC',
    [status]
  );
  return rows.map(rowToLead);
}

export async function deleteLead(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM leads WHERE id = ?', [id]);
}

function rowToLead(row: any): PropertyLead {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address || '',
    notes: row.notes || '',
    photoUri: row.photoUri,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.createdAt,
    sessionId: row.sessionId,
    status: row.status || 'new',
  };
}

// ===== Settings Operations =====

export async function getSettings(): Promise<AppSettings> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM settings');

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof AppSettings;
    if (key in settings) {
      const value = row.value;
      if (typeof settings[key] === 'number') {
        (settings as any)[key] = parseFloat(value);
      } else if (typeof settings[key] === 'boolean') {
        (settings as any)[key] = value === 'true';
      } else {
        (settings as any)[key] = value;
      }
    }
  }
  return settings;
}

export async function saveSetting(key: keyof AppSettings, value: string | number | boolean): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, String(value)]
  );
}

// ===== Stats =====

export async function getStats(): Promise<{
  totalSessions: number;
  totalMiles: number;
  totalLeads: number;
  totalDrivingTime: number;
}> {
  const database = await getDb();

  const sessionStats = await database.getFirstAsync<any>(
    'SELECT COUNT(*) as count, COALESCE(SUM(distanceMiles), 0) as miles, COALESCE(SUM(endTime - startTime), 0) as time FROM sessions WHERE isActive = 0'
  );
  const leadCount = await database.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM leads'
  );

  return {
    totalSessions: sessionStats?.count || 0,
    totalMiles: sessionStats?.miles || 0,
    totalLeads: leadCount?.count || 0,
    totalDrivingTime: sessionStats?.time || 0,
  };
}

// ===== Export =====

export async function exportLeadsAsCSV(): Promise<string> {
  const leads = await getAllLeads();
  const header = 'ID,Address,Latitude,Longitude,Status,Notes,Tags,Created,Session ID\n';
  const rows = leads.map((lead) =>
    [
      lead.id,
      `"${lead.address.replace(/"/g, '""')}"`,
      lead.latitude,
      lead.longitude,
      lead.status,
      `"${lead.notes.replace(/"/g, '""')}"`,
      `"${lead.tags.join(', ')}"`,
      new Date(lead.createdAt).toISOString(),
      lead.sessionId || '',
    ].join(',')
  );
  return header + rows.join('\n');
}
