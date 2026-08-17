import type { AccessRepository, EnsureIdentityInput } from '../../application/ports/access-repository';
import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';
import { getDatabase } from '@/shared/infrastructure/database/neon';

export class PostgresAccessRepository implements AccessRepository {
  async ensureIdentity(input: EnsureIdentityInput): Promise<AccessProfile> {
    const existing = await this.getByAuthIdentity(input.provider, input.subject);
    if (existing) return existing;

    const sql = getDatabase();
    const email = input.email.trim().toLowerCase();
    const users = await sql`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`;
    let userId = users[0]?.id ? String(users[0].id) : '';

    if (!userId) {
      const created = await sql`INSERT INTO users (email) VALUES (${email}) RETURNING id`;
      userId = String(created[0].id);
    }

    await sql`INSERT INTO auth_identities (user_id, provider, subject) VALUES (${userId}, ${input.provider}, ${input.subject}) ON CONFLICT (provider, subject) DO NOTHING`;
    await sql`INSERT INTO profiles (user_id, display_name) VALUES (${userId}, ${input.displayName}) ON CONFLICT (user_id) DO NOTHING`;

    const profiles = await sql`SELECT id FROM profiles WHERE user_id = ${userId} LIMIT 1`;
    const profileId = String(profiles[0].id);
    await sql`INSERT INTO profile_roles (profile_id, role_id) SELECT ${profileId}, id FROM roles WHERE code = 'agent' ON CONFLICT DO NOTHING`;

    const profile = await this.getByAuthIdentity(input.provider, input.subject);
    if (!profile) throw new Error('Unable to synchronize authenticated profile');
    return profile;
  }

  async getByAuthIdentity(provider: string, subject: string): Promise<AccessProfile | null> {
    const sql = getDatabase();
    const rows = await sql`
      SELECT p.id AS profile_id, u.id AS user_id, u.email, p.display_name, p.status,
        COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
        COALESCE(array_agg(DISTINCT pe.code) FILTER (WHERE pe.code IS NOT NULL), '{}') AS permissions
      FROM auth_identities ai
      JOIN users u ON u.id = ai.user_id
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN profile_roles pr ON pr.profile_id = p.id
      LEFT JOIN roles r ON r.id = pr.role_id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions pe ON pe.id = rp.permission_id
      WHERE ai.provider = ${provider} AND ai.subject = ${subject}
      GROUP BY p.id, u.id, u.email, p.display_name, p.status
      LIMIT 1`;

    return rows[0] ? mapAccessProfile(rows[0]) : null;
  }

  async hasPermission(profileId: string, permission: PermissionCode): Promise<boolean> {
    const sql = getDatabase();
    const rows = await sql`
      SELECT EXISTS (
        SELECT 1 FROM profile_roles pr
        JOIN role_permissions rp ON rp.role_id = pr.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE pr.profile_id = ${profileId} AND p.code = ${permission}
      ) AS allowed`;
    return Boolean(rows[0]?.allowed);
  }

  async assignRole(profileId: string, role: RoleCode, assignedBy?: string): Promise<void> {
    const sql = getDatabase();
    await sql`INSERT INTO profile_roles (profile_id, role_id, assigned_by) SELECT ${profileId}, id, ${assignedBy ?? null} FROM roles WHERE code = ${role} ON CONFLICT DO NOTHING`;
  }
}

function mapAccessProfile(row: Record<string, unknown>): AccessProfile {
  return {
    profileId: String(row.profile_id),
    userId: String(row.user_id),
    email: String(row.email),
    displayName: String(row.display_name),
    status: String(row.status) === 'disabled' ? 'disabled' : 'active',
    roles: Array.isArray(row.roles) ? row.roles.map(String) as RoleCode[] : [],
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) as PermissionCode[] : [],
  };
}
