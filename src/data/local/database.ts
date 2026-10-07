import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'learning.db';

/** Ordered schema migrations; index + 1 is the resulting PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE courses (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    instructor TEXT NOT NULL,
    progress INTEGER NOT NULL,
    lesson_count INTEGER NOT NULL
  );
  CREATE TABLE lessons (
    id TEXT PRIMARY KEY NOT NULL,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    pending_sync INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_lessons_course ON lessons(course_id);
  CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  `,
];

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(MIGRATIONS[v]);
      await tx.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

let instance: Promise<SQLite.SQLiteDatabase> | null = null;

/** Lazily opened, migrated singleton connection. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  instance ??= SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
    await migrate(db);
    return db;
  });
  // Don't cache a failed open/migration; let the next caller retry.
  instance.catch(() => {
    instance = null;
  });
  return instance;
}
