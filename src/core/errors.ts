/** Typed failures the UI can map to user-facing copy without string matching. */
export type AppErrorKind = 'offline' | 'unauthorized' | 'server' | 'not_found' | 'unknown';

export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  return new AppError('unknown', e instanceof Error ? e.message : 'Something went wrong');
}

export function userMessage(e: AppError): string {
  switch (e.kind) {
    case 'offline':
      return "You're offline. Connect to the internet and try again.";
    case 'unauthorized':
      return e.message;
    case 'not_found':
      return "We couldn't find that course.";
    case 'server':
      return 'The server had a problem. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
