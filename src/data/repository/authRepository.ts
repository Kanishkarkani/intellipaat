import { toAppError } from '@/core/errors';
import type { Session } from '@/domain/models';

import type { SessionStorage } from '../local/tokenStorage';
import type { AuthApi } from '../remote/authApi';

export class AuthRepository {
  constructor(
    private readonly api: AuthApi,
    private readonly storage: SessionStorage,
  ) {}

  restoreSession(): Promise<Session | null> {
    return this.storage.load().catch(() => null);
  }

  async login(email: string, password: string): Promise<Session> {
    try {
      const { token } = await this.api.login(email.trim().toLowerCase(), password);
      const session = { token, email: email.trim().toLowerCase() };
      await this.storage.save(session);
      return session;
    } catch (e) {
      throw toAppError(e);
    }
  }

  logout(): Promise<void> {
    return this.storage.clear();
  }
}
