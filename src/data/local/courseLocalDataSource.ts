import type { Course, CourseId, Lesson } from '@/domain/models';

/** Persistence contract for the offline cache. The repository is the only caller. */
export interface CourseLocalDataSource {
  getCourses(): Promise<Course[]>;
  getCourse(id: CourseId): Promise<Course | null>;
  /** Replaces the course list (courses removed server-side are dropped along with their lessons). */
  replaceCourses(courses: Course[]): Promise<void>;
  updateCourseProgress(id: CourseId, progress: number): Promise<void>;

  getLessons(courseId: CourseId): Promise<Lesson[]>;
  replaceLessons(courseId: CourseId, lessons: Lesson[]): Promise<void>;
  markLessonCompleted(lessonId: string): Promise<void>;

  /** Outbox: completions made locally that the server hasn't acknowledged yet. */
  getPendingCompletions(): Promise<Pick<Lesson, 'id' | 'courseId'>[]>;
  clearPending(lessonId: string): Promise<void>;

  /** Null until the first successful sync — distinguishes "never loaded" from "server has no courses". */
  getLastSyncedAt(): Promise<number | null>;
  setLastSyncedAt(timestamp: number): Promise<void>;

  clear(): Promise<void>;
}
