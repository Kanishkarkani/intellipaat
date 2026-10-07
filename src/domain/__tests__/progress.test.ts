import { calculateProgress } from '../progress';

describe('calculateProgress', () => {
  const lessons = (done: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({ completed: i < done }));

  it.each([
    [0, 0, 0], // no lessons → 0, not NaN
    [0, 20, 0],
    [13, 20, 65],
    [1, 3, 33], // rounds to whole percent
    [2, 3, 67],
    [16, 16, 100],
  ])('%i of %i completed → %i%%', (done, total, expected) => {
    expect(calculateProgress(lessons(done, total))).toBe(expected);
  });
});
