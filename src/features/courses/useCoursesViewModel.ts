import { useCallback, useEffect, useRef, useState } from 'react';

import { container } from '@/core/container';
import { toAppError, type AppError } from '@/core/errors';
import type { Course, DataSource } from '@/domain/models';

export type CoursesUiState =
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'empty' }
  | {
      status: 'success';
      courses: Course[];
      source: DataSource;
      /** Non-fatal: refresh failed but cached data is shown. */
      refreshError?: AppError;
    };

const { courseRepository } = container;

export function useCoursesViewModel() {
  const [state, setState] = useState<CoursesUiState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastSource = useRef<DataSource>('cache');

  const show = useCallback((courses: Course[], source: DataSource, refreshError?: AppError) => {
    lastSource.current = source;
    setState(
      courses.length === 0
        ? { status: 'empty' }
        : { status: 'success', courses, source, refreshError },
    );
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await courseRepository.refreshCourses();
      show(result.courses, result.source, result.error);
    } catch (e) {
      setState({ status: 'error', error: toAppError(e) });
    } finally {
      setIsRefreshing(false);
    }
  }, [show]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    // Stale-while-revalidate: paint cache instantly, then refresh from the network.
    courseRepository
      .getCachedCourses()
      .then((cached) => {
        if (!cancelled && cached) show(cached, 'cache');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) void refresh();
      });

    // Local writes (e.g. lesson completed on the details screen) update progress here.
    const unsubscribe = courseRepository.subscribe(() => {
      courseRepository.getCachedCourses().then((cached) => {
        if (!cancelled && cached) {
          setState((prev) =>
            prev.status === 'success'
              ? { ...prev, courses: cached }
              : cached.length
                ? { status: 'success', courses: cached, source: lastSource.current }
                : prev,
          );
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refresh, show]);

  return { state, isRefreshing, refresh, retry };
}
