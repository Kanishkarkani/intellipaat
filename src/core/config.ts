/**
 * Mock-backend knobs so every UI state (failure, empty) can be demoed without code changes.
 * Set in .env, e.g. EXPO_PUBLIC_MOCK_FAILURE_RATE=0.5, then restart Metro.
 */
export const config = {
  mockLatencyMs: Number(process.env.EXPO_PUBLIC_MOCK_LATENCY_MS ?? 800),
  mockFailureRate: Number(process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE ?? 0),
  mockEmptyCourses: process.env.EXPO_PUBLIC_MOCK_EMPTY === 'true',
};
