import { useCallback, useEffect, useState } from 'react';

import { container } from '@/core/container';
import { toAppError, type AppError } from '@/core/errors';
import type { CourseDetail, CourseId, DataSource } from '@/domain/models';

export type CourseDetailUiState =
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'success'; detail: CourseDetail; source: DataSource; refreshError?: AppError };

const { courseRepository } = container;

export function useCourseDetailViewModel(courseId: CourseId) {
  const [state, setState] = useState<CourseDetailUiState>({ status: 'loading' });
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const revalidate = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      try {
        const result = await courseRepository.refreshCourseDetail(courseId);
        if (isCancelled()) return;
        setState({
          status: 'success',
          detail: result.detail,
          source: result.source,
          refreshError: result.error,
        });
      } catch (e) {
        if (!isCancelled()) setState({ status: 'error', error: toAppError(e) });
      }
    },
    [courseId],
  );

  useEffect(() => {
    let cancelled = false;
    // Stale-while-revalidate: paint cached lessons immediately, then refresh from the network.
    courseRepository
      .getCachedCourseDetail(courseId)
      .catch(() => null)
      .then((cached) => {
        if (cancelled) return;
        if (cached && cached.lessons.length > 0) {
          setState({ status: 'success', detail: cached, source: 'cache' });
        }
        return revalidate(() => cancelled);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, revalidate]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    void revalidate();
  }, [revalidate]);

  const markCompleted = useCallback(
    async (lessonId: string) => {
      setActionError(null);
      try {
        const { synced } = await courseRepository.markLessonCompleted(courseId, lessonId);
        if (!synced) setPendingSyncCount((n) => n + 1);
        const detail = await courseRepository.getCachedCourseDetail(courseId);
        if (detail) setState((prev) => (prev.status === 'success' ? { ...prev, detail } : prev));
      } catch {
        setActionError("Couldn't save your progress. Please try again.");
      }
    },
    [courseId],
  );

  return { state, pendingSyncCount, actionError, markCompleted, retry };
}
