import type { Lesson } from './models';

/** Whole-number completion percentage. Empty courses are 0%, never NaN. */
export function calculateProgress(lessons: readonly Pick<Lesson, 'completed'>[]): number {
  if (lessons.length === 0) return 0;
  const completed = lessons.filter((l) => l.completed).length;
  return Math.round((completed / lessons.length) * 100);
}

export function completeLesson<T extends Lesson>(lessons: readonly T[], lessonId: string): T[] {
  return lessons.map((l) => (l.id === lessonId ? { ...l, completed: true } : l));
}
