import { AppError, toAppError } from '@/core/errors';
import type { Course, CourseDetail, CourseId, DataSource, Lesson } from '@/domain/models';
import { calculateProgress } from '@/domain/progress';

import type { CourseLocalDataSource } from '../local/courseLocalDataSource';
import type { CourseApi } from '../remote/courseApi';

export interface CoursesResult {
  courses: Course[];
  source: DataSource;
  /** Set when we fell back to cache because the network call failed. */
  error?: AppError;
}

export interface CourseDetailResult {
  detail: CourseDetail;
  source: DataSource;
  error?: AppError;
}

type Listener = () => void;

/**
 * Single source of truth for course data. The local DB is what the UI reads;
 * the network only ever writes into it ("offline-first"). Lesson completion is
 * monotonic (pending → completed, never back), so merging is a simple OR and
 * needs no conflict resolution.
 */
export class CourseRepository {
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly api: CourseApi,
    private readonly local: CourseLocalDataSource,
  ) {}

  /** Notifies when cached data changes, so every screen stays in sync (e.g. dashboard progress). */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Null when nothing has ever been cached (UI should show a loader, not "empty"). */
  async getCachedCourses(): Promise<Course[] | null> {
    const syncedAt = await this.local.getLastSyncedAt();
    return syncedAt === null ? null : this.local.getCourses();
  }

  /** Fetches from the network into the cache. Falls back to cache if the network fails. */
  async refreshCourses(): Promise<CoursesResult> {
    try {
      await this.flushPendingCompletions();
      const remote = await this.api.getCourses();
      const merged = await Promise.all(remote.map((c) => this.mergeWithLocalProgress(c)));
      await this.local.replaceCourses(merged);
      await this.local.setLastSyncedAt(Date.now());
      this.notify();
      return { courses: merged, source: 'network' };
    } catch (e) {
      const cached = await this.getCachedCourses();
      if (cached === null) throw toAppError(e);
      return { courses: cached, source: 'cache', error: toAppError(e) };
    }
  }

  async getCachedCourseDetail(courseId: CourseId): Promise<CourseDetail | null> {
    const course = await this.local.getCourse(courseId);
    if (!course) return null;
    return { course, lessons: await this.local.getLessons(courseId) };
  }

  async refreshCourseDetail(courseId: CourseId): Promise<CourseDetailResult> {
    try {
      await this.flushPendingCompletions();
      const remote = await this.api.getLessons(courseId);
      const local = await this.local.getLessons(courseId);
      const lessons = mergeLessons(remote, local);
      await this.local.replaceLessons(courseId, lessons);
      await this.local.updateCourseProgress(courseId, calculateProgress(lessons));
      this.notify();
      const detail = await this.getCachedCourseDetail(courseId);
      if (!detail) throw new AppError('not_found', `Course ${courseId} not cached`);
      return { detail, source: 'network' };
    } catch (e) {
      const cached = await this.getCachedCourseDetail(courseId);
      if (!cached || cached.lessons.length === 0) throw toAppError(e);
      return { detail: cached, source: 'cache', error: toAppError(e) };
    }
  }

  /**
   * Optimistic: persists locally first so it works offline, then tries to sync.
   * A failed sync leaves the lesson in the outbox for the next refresh.
   */
  async markLessonCompleted(courseId: CourseId, lessonId: string): Promise<{ synced: boolean }> {
    await this.local.markLessonCompleted(lessonId);
    const lessons = await this.local.getLessons(courseId);
    await this.local.updateCourseProgress(courseId, calculateProgress(lessons));
    this.notify();

    try {
      await this.api.markLessonCompleted(courseId, lessonId);
      await this.local.clearPending(lessonId);
      return { synced: true };
    } catch {
      return { synced: false };
    }
  }

  async clear() {
    await this.local.clear();
    this.notify();
  }

  /** Best-effort: a failed push must not block reads; unsynced items stay queued and are OR-merged anyway. */
  private async flushPendingCompletions() {
    const pending = await this.local.getPendingCompletions();
    for (const p of pending) {
      try {
        await this.api.markLessonCompleted(p.courseId, p.id);
        await this.local.clearPending(p.id);
      } catch {
        return;
      }
    }
  }

  /** Server progress may lag behind local completions; recompute from cached lessons if we have them. */
  private async mergeWithLocalProgress(remote: Course): Promise<Course> {
    const localLessons = await this.local.getLessons(remote.id);
    if (localLessons.length === 0) return remote;
    return { ...remote, progress: Math.max(remote.progress, calculateProgress(localLessons)) };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

/** Completed if either side says so — completion never goes backwards. */
export function mergeLessons(remote: Lesson[], local: Lesson[]): Lesson[] {
  const localDone = new Set(local.filter((l) => l.completed).map((l) => l.id));
  return remote.map((l) => (localDone.has(l.id) ? { ...l, completed: true } : l));
}
