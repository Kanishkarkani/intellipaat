import { AppError } from '@/core/errors';
import { config } from '@/core/config';
import type { Course, CourseId, Lesson } from '@/domain/models';
import { calculateProgress } from '@/domain/progress';
import seed from '@/data/mock/courses.json';

import type { AuthApi } from './authApi';
import type { CourseApi } from './courseApi';
import { isOnline as defaultIsOnline, type ConnectivityCheck } from './network';

export const DEMO_PASSWORD = 'password123';

interface MockOptions {
  latencyMs?: number;
  failureRate?: number;
  empty?: boolean;
  isOnline?: ConnectivityCheck;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates a REST backend: latency, real device connectivity, and configurable failures.
 * State lives in memory, so it resets on app restart — local cache merges are designed for that.
 */
abstract class MockBackend {
  protected readonly latencyMs: number;
  protected readonly failureRate: number;
  private readonly isOnline: ConnectivityCheck;

  constructor(opts: MockOptions = {}) {
    this.latencyMs = opts.latencyMs ?? config.mockLatencyMs;
    this.failureRate = opts.failureRate ?? config.mockFailureRate;
    this.isOnline = opts.isOnline ?? defaultIsOnline;
  }

  protected async request<T>(handler: () => T): Promise<T> {
    if (!(await this.isOnline())) throw new AppError('offline', 'No internet connection');
    await delay(this.latencyMs);
    if (Math.random() < this.failureRate) throw new AppError('server', 'HTTP 500');
    return handler();
  }
}

export class MockCourseApi extends MockBackend implements CourseApi {
  private readonly lessons = new Map<CourseId, Lesson[]>();
  private readonly courses: Omit<Course, 'progress' | 'lessons'>[];

  constructor(opts: MockOptions = {}) {
    super(opts);
    const data = (opts.empty ?? config.mockEmptyCourses) ? [] : seed;
    this.courses = data.map(({ id, title, instructor }) => ({ id, title, instructor }));
    for (const c of data) {
      this.lessons.set(
        c.id,
        c.lessons.map((title, i) => ({
          id: `${c.id}-${i + 1}`,
          courseId: c.id,
          title,
          position: i + 1,
          completed: i < c.completedCount,
        })),
      );
    }
  }

  getCourses(): Promise<Course[]> {
    return this.request(() =>
      this.courses.map((c) => {
        const lessons = this.lessons.get(c.id) ?? [];
        return { ...c, lessons: lessons.length, progress: calculateProgress(lessons) };
      }),
    );
  }

  getLessons(courseId: CourseId): Promise<Lesson[]> {
    return this.request(() => {
      const lessons = this.lessons.get(courseId);
      if (!lessons) throw new AppError('not_found', `Course ${courseId} not found`);
      return lessons.map((l) => ({ ...l }));
    });
  }

  markLessonCompleted(courseId: CourseId, lessonId: string): Promise<void> {
    return this.request(() => {
      const lesson = this.lessons.get(courseId)?.find((l) => l.id === lessonId);
      if (!lesson) throw new AppError('not_found', `Lesson ${lessonId} not found`);
      lesson.completed = true;
    });
  }
}

export class MockAuthApi extends MockBackend implements AuthApi {
  login(email: string, password: string) {
    return this.request(() => {
      if (password !== DEMO_PASSWORD) {
        throw new AppError('unauthorized', 'Incorrect email or password.');
      }
      // A real backend would return a signed, expiring JWT/opaque token.
      return { token: `mock-token.${encodeURIComponent(email)}.${Date.now()}` };
    });
  }
}
