import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { container } from '@/core/container';
import type { Session } from '@/domain/models';

interface SessionContextValue {
  session: Session | null;
  isRestoring: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const { authRepository, courseRepository } = container;

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    authRepository
      .restoreSession()
      .then(setSession)
      .finally(() => setIsRestoring(false));
  }, []);

  const value: SessionContextValue = {
    session,
    isRestoring,
    async signIn(email, password) {
      setSession(await authRepository.login(email, password));
    },
    async signOut() {
      // Cached course data belongs to this user; don't leak it to the next one.
      await Promise.all([authRepository.logout(), courseRepository.clear()]);
      setSession(null);
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
