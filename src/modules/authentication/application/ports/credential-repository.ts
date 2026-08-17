export interface CredentialRecord {
  userId: string;
  email: string;
  displayName: string;
  profileStatus: 'active' | 'disabled';
  sessionVersion: number;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

export interface CredentialRepository {
  findByEmail(email: string): Promise<CredentialRecord | null>;
  recordFailure(userId: string, failedAttempts: number, lockedUntil: Date | null): Promise<void>;
  recordSuccess(userId: string): Promise<void>;
}
