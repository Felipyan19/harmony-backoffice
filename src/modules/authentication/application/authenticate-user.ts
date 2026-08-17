import type { CredentialRepository } from './ports/credential-repository';
import type { PasswordHasher } from './ports/password-hasher';

const LOCK_AFTER_FAILURES = 5;
const LOCK_MINUTES = 15;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  sessionVersion: number;
}

export class AuthenticateUser {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: { email: string; password: string }): Promise<AuthenticatedUser | null> {
    const record = await this.credentials.findByEmail(input.email.trim().toLowerCase());
    if (!record) return null;
    if (record.profileStatus !== 'active') return null;
    if (record.lockedUntil && record.lockedUntil.getTime() > Date.now()) return null;

    const valid = await this.passwordHasher.verify(record.passwordHash, input.password);
    if (!valid) {
      const failedAttempts = record.failedAttempts + 1;
      const lockedUntil = failedAttempts >= LOCK_AFTER_FAILURES
        ? new Date(Date.now() + LOCK_MINUTES * 60_000)
        : null;
      await this.credentials.recordFailure(record.userId, failedAttempts, lockedUntil);
      return null;
    }

    await this.credentials.recordSuccess(record.userId);
    return {
      id: record.userId,
      email: record.email,
      name: record.displayName,
      sessionVersion: record.sessionVersion,
    };
  }
}
