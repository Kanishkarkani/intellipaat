import { AppError } from '@/core/errors';
import type { CourseLocalDataSource } from '@/data/local/courseLocalDataSource';
import { MockCourseApi } from '@/data/remote/mockServer';
import type { Course, CourseId, Lesson } from '@/domain/models';

import { CourseRepository } from '../courseRepository';

/** In-memory stand-in for SQLite with the same contract (incl. the pending-sync outbox). */
class InMemoryLocal implements CourseLocalDataSource {
  courses = new Map<CourseId, Course>();
  lessons = new Map<string, Lesson & { pending: boolean }>();
  syncedAt: number | null = null;

  async getCourses() {
    return [...this.courses.values()];
  }
  async getCourse(id: CourseId) {
    return this.courses.get(id) ?? null;
  }
  async replaceCourses(courses: Course[]) {
    this.courses = new Map(courses.map((c) => [c.id, { ...c }]));
  }
  async updateCourseProgress(id: CourseId, progress: number) {
    const c = this.courses.get(id);
    if (c) c.progress = progress;
  }
  async getLessons(courseId: CourseId) {
    return [...this.lessons.values()]
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.position - b.position)
      .map(({ pending, ...l }) => l);
  }
  async replaceLessons(_courseId: CourseId, lessons: Lesson[]) {
    for (const l of lessons) {
      this.lessons.set(l.id, { ...l, pending: this.lessons.get(l.id)?.pending ?? false });
    }
  }
  async markLessonCompleted(lessonId: string) {
    const l = this.lessons.get(lessonId);
    if (l) Object.assign(l, { completed: true, pending: true });
  }
  async getPendingCompletions() {
    return [...this.lessons.values()].filter((l) => l.pending);
  }
  async clearPending(lessonId: string) {
    const l = this.lessons.get(lessonId);
    if (l) l.pending = false;
  }
  async getLastSyncedAt() {
    return this.syncedAt;
  }
  async setLastSyncedAt(t: number) {
    this.syncedAt = t;
  }
  async clear() {
    this.courses.clear();
    this.lessons.clear();
    this.syncedAt = null;
  }
}

function setup() {
  let online = true;
  const api = new MockCourseApi({ latencyMs: 0, failureRate: 0, empty: false, isOnline: async () => online });
  const local = new InMemoryLocal();
  const repo = new CourseRepository(api, local);
  return { repo, api, local, goOffline: () => (online = false), goOnline: () => (online = true) };
}

describe('CourseRepository', () => {
  it('serves previously loaded courses from cache when offline', async () => {
    const { repo, goOffline } = setup();
    const online = await repo.refreshCourses();
    expect(online.source).toBe('network');
    expect(online.courses.map((c) => c.title)).toEqual([
      'Python Programming',
      'Generative AI',
      'Full Stack Development',
    ]);

    goOffline();
    const offline = await repo.refreshCourses();

    expect(offline.source).toBe('cache');
    expect(offline.error?.kind).toBe('offline');
    expect(offline.courses).toEqual(online.courses);
  });

  it('surfaces an error when offline and nothing has ever been cached', async () => {
    const { repo, goOffline } = setup();
    goOffline();
    await expect(repo.refreshCourses()).rejects.toEqual(expect.any(AppError));
    await expect(repo.getCachedCourses()).resolves.toBeNull();
  });

  it('completes a lesson offline, updates progress, and syncs it once back online', async () => {
    const { repo, api, local, goOffline, goOnline } = setup();
    await repo.refreshCourses();
    await repo.refreshCourseDetail(1); // Python: 13/20 done = 65%
    const listener = jest.fn();
    repo.subscribe(listener);

    goOffline();
    const { synced } = await repo.markLessonCompleted(1, '1-14');

    expect(synced).toBe(false);
    expect(listener).toHaveBeenCalled(); // dashboard gets notified
    expect((await local.getCourse(1))?.progress).toBe(70); // 14/20
    expect(await local.getPendingCompletions()).toHaveLength(1);

    // A refresh while still offline must not lose the local completion.
    const cached = await repo.refreshCourseDetail(1);
    expect(cached.detail.lessons.find((l) => l.id === '1-14')?.completed).toBe(true);

    goOnline();
    const refreshed = await repo.refreshCourseDetail(1);

    expect(refreshed.source).toBe('network');
    expect(refreshed.detail.course.progress).toBe(70);
    expect(await local.getPendingCompletions()).toHaveLength(0);
    const serverLessons = await api.getLessons(1);
    expect(serverLessons.find((l) => l.id === '1-14')?.completed).toBe(true);
  });
});
