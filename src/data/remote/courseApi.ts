import type { Course, CourseId, Lesson } from '@/domain/models';

/** Wire contract for the courses backend. Swap the mock for an HTTP client without touching callers. */
export interface CourseApi {
  getCourses(): Promise<Course[]>;
  getLessons(courseId: CourseId): Promise<Lesson[]>;
  markLessonCompleted(courseId: CourseId, lessonId: string): Promise<void>;
}
