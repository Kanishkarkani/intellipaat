import { getDatabase } from '@/data/local/database';
import { SqliteCourseLocalDataSource } from '@/data/local/sqliteCourseLocalDataSource';
import { SecureSessionStorage } from '@/data/local/tokenStorage';
import { MockAuthApi, MockCourseApi } from '@/data/remote/mockServer';
import { AuthRepository } from '@/data/repository/authRepository';
import { CourseRepository } from '@/data/repository/courseRepository';

/**
 * Composition root: the only place concrete implementations are chosen.
 * Swapping the mock APIs for real HTTP clients is a change here and nowhere else.
 */
export const container = {
  authRepository: new AuthRepository(new MockAuthApi(), new SecureSessionStorage()),
  courseRepository: new CourseRepository(
    new MockCourseApi(),
    new SqliteCourseLocalDataSource(getDatabase),
  ),
};
