import 'server-only';

import { eq, sql } from 'drizzle-orm';
import { getDrizzleDatabase } from '@/shared/infrastructure/database/drizzle';
import { passwordCredentials, profiles, users } from '@/shared/infrastructure/database/schema';
import type { CredentialRecord, CredentialRepository } from '../../application/ports/credential-repository';

export class PostgresCredentialRepository implements CredentialRepository {
  async findByEmail(email: string): Promise<CredentialRecord | null> {
    const db = getDrizzleDatabase();
    const [row] = await db
      .select({
        userId: users.id,
        email: users.email,
        displayName: profiles.displayName,
        profileStatus: profiles.status,
        sessionVersion: users.sessionVersion,
        passwordHash: passwordCredentials.passwordHash,
        failedAttempts: passwordCredentials.failedAttempts,
        lockedUntil: passwordCredentials.lockedUntil,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);

    if (!row) return null;
    return {
      ...row,
      profileStatus: row.profileStatus === 'disabled' ? 'disabled' : 'active',
    };
  }

  async recordFailure(userId: string, failedAttempts: number, lockedUntil: Date | null) {
    const db = getDrizzleDatabase();
    await db
      .update(passwordCredentials)
      .set({ failedAttempts, lockedUntil })
      .where(eq(passwordCredentials.userId, userId));
  }

  async recordSuccess(userId: string) {
    const db = getDrizzleDatabase();
    await db.transaction(async (tx) => {
      await tx
        .update(passwordCredentials)
        .set({ failedAttempts: 0, lockedUntil: null })
        .where(eq(passwordCredentials.userId, userId));
      await tx
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userId));
    });
  }
}
