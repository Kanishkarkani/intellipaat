import type { SQLiteDatabase } from 'expo-sqlite';

import type { Course, CourseId, Lesson } from '@/domain/models';

import type { CourseLocalDataSource } from './courseLocalDataSource';

interface CourseRow {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  lesson_count: number;
}

interface LessonRow {
  id: string;
  course_id: number;
  title: string;
  position: number;
  completed: number;
}

const toCourse = (r: CourseRow): Course => ({
  id: r.id,
  title: r.title,
  instructor: r.instructor,
  progress: r.progress,
  lessons: r.lesson_count,
});

const toLesson = (r: LessonRow): Lesson => ({
  id: r.id,
  courseId: r.course_id,
  title: r.title,
  position: r.position,
  completed: r.completed === 1,
});

const LAST_SYNCED_KEY = 'courses_last_synced_at';

export class SqliteCourseLocalDataSource implements CourseLocalDataSource {
  constructor(private readonly getDb: () => Promise<SQLiteDatabase>) {}

  async getCourses() {
    const db = await this.getDb();
    const rows = await db.getAllAsync<CourseRow>('SELECT * FROM courses ORDER BY id');
    return rows.map(toCourse);
  }

  async getCourse(id: CourseId) {
    const db = await this.getDb();
    const row = await db.getFirstAsync<CourseRow>('SELECT * FROM courses WHERE id = ?', id);
    return row ? toCourse(row) : null;
  }

  async replaceCourses(courses: Course[]) {
    const db = await this.getDb();
    await db.withExclusiveTransactionAsync(async (tx) => {
      const ids = courses.map((c) => c.id);
      // Drop courses the server no longer returns (lessons cascade).
      await tx.runAsync(
        `DELETE FROM courses WHERE id NOT IN (${ids.map(() => '?').join(',') || 'NULL'})`,
        ids,
      );
      for (const c of courses) {
        await tx.runAsync(
          `INSERT INTO courses (id, title, instructor, progress, lesson_count) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET title = excluded.title, instructor = excluded.instructor,
             progress = excluded.progress, lesson_count = excluded.lesson_count`,
          c.id,
          c.title,
          c.instructor,
          c.progress,
          c.lessons,
        );
      }
    });
  }

  async updateCourseProgress(id: CourseId, progress: number) {
    const db = await this.getDb();
    await db.runAsync('UPDATE courses SET progress = ? WHERE id = ?', progress, id);
  }

  async getLessons(courseId: CourseId) {
    const db = await this.getDb();
    const rows = await db.getAllAsync<LessonRow>(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY position',
      courseId,
    );
    return rows.map(toLesson);
  }

  async replaceLessons(courseId: CourseId, lessons: Lesson[]) {
    const db = await this.getDb();
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        `DELETE FROM lessons WHERE course_id = ? AND id NOT IN (${lessons.map(() => '?').join(',') || 'NULL'})`,
        courseId,
        ...lessons.map((l) => l.id),
      );
      for (const l of lessons) {
        // Keeps pending_sync intact so unsynced local completions survive a refresh.
        await tx.runAsync(
          `INSERT INTO lessons (id, course_id, title, position, completed) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET title = excluded.title, position = excluded.position,
             completed = excluded.completed`,
          l.id,
          l.courseId,
          l.title,
          l.position,
          l.completed ? 1 : 0,
        );
      }
    });
  }

  async markLessonCompleted(lessonId: string) {
    const db = await this.getDb();
    await db.runAsync('UPDATE lessons SET completed = 1, pending_sync = 1 WHERE id = ?', lessonId);
  }

  async getPendingCompletions() {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{ id: string; course_id: number }>(
      'SELECT id, course_id FROM lessons WHERE pending_sync = 1',
    );
    return rows.map((r) => ({ id: r.id, courseId: r.course_id }));
  }

  async clearPending(lessonId: string) {
    const db = await this.getDb();
    await db.runAsync('UPDATE lessons SET pending_sync = 0 WHERE id = ?', lessonId);
  }

  async getLastSyncedAt() {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      LAST_SYNCED_KEY,
    );
    return row ? Number(row.value) : null;
  }

  async setLastSyncedAt(timestamp: number) {
    const db = await this.getDb();
    await db.runAsync(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      LAST_SYNCED_KEY,
      String(timestamp),
    );
  }

  async clear() {
    const db = await this.getDb();
    await db.execAsync('DELETE FROM lessons; DELETE FROM courses; DELETE FROM meta;');
  }
}
