import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS epg_data (
    id              TEXT    NOT NULL,
    start_timestamp INTEGER NOT NULL,
    stop_timestamp  INTEGER NOT NULL,
    title           TEXT,
    description     TEXT,
    PRIMARY KEY (id, start_timestamp)
  );

  CREATE INDEX IF NOT EXISTS idx_epg_stop  ON epg_data (stop_timestamp);
  CREATE INDEX IF NOT EXISTS idx_epg_range ON epg_data (id, start_timestamp, stop_timestamp);
`);

export const queries = {
  avgStopSince: db.prepare<[]>(
    `SELECT CAST(AVG(max_stop) AS INTEGER) AS avg_stop
       FROM (SELECT id, MAX(stop_timestamp) AS max_stop FROM epg_data GROUP BY id)`
  ),
  deleteOld: db.prepare<[number]>(`DELETE FROM epg_data WHERE start_timestamp < ?`),
  insertProgramme: db.prepare<
    [string, number, number, string, string]
  >(
    `INSERT OR IGNORE INTO epg_data (id, start_timestamp, stop_timestamp, title, description)
       VALUES (?, ?, ?, ?, ?)`
  ),
  getEpg: db.prepare<[string, number, number]>(
    `SELECT start_timestamp, stop_timestamp, title, description
       FROM epg_data
      WHERE id = ? AND start_timestamp < ? AND stop_timestamp >= ?
      ORDER BY start_timestamp`
  ),
};
