import type { RoleCode } from '@/modules/access/domain/access';
import { getDatabase } from '@/shared/infrastructure/database/neon';
import type { CreateInternalUserInput, UpdateInternalUserInput, UserRepository } from '../../application/ports/user-repository';
import type { BackofficeUser, RoleOption } from '../../domain/user';

export class PostgresUserRepository implements UserRepository {
  async list(): Promise<BackofficeUser[]> {
    const sql = getDatabase();
    const rows = await sql`
      SELECT u.id AS user_id, p.id AS profile_id, u.email, p.display_name, p.phone, p.status, u.created_at,
        MAX(ai.subject) FILTER (WHERE ai.provider = 'neon-auth') AS auth_subject,
        COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
      FROM users u JOIN profiles p ON p.user_id=u.id
      LEFT JOIN auth_identities ai ON ai.user_id=u.id
      LEFT JOIN profile_roles pr ON pr.profile_id=p.id
      LEFT JOIN roles r ON r.id=pr.role_id
      GROUP BY u.id,p.id ORDER BY p.display_name`;
    return rows.map(mapUser);
  }

  async listRoles(): Promise<RoleOption[]> {
    const sql = getDatabase();
    const rows = await sql`SELECT code,name,description FROM roles ORDER BY name`;
    return rows.map((r) => ({ code: String(r.code) as RoleCode, name: String(r.name), description: r.description ? String(r.description) : undefined }));
  }

  async createFromIdentity(input: CreateInternalUserInput): Promise<BackofficeUser> {
    const sql = getDatabase();
    const created = await sql`INSERT INTO users(email) VALUES (${input.email.toLowerCase()}) RETURNING id`;
    const userId = String(created[0].id);
    await sql`INSERT INTO auth_identities(user_id,provider,subject) VALUES (${userId},'neon-auth',${input.authSubject})`;
    const profiles = await sql`INSERT INTO profiles(user_id,display_name,phone) VALUES (${userId},${input.displayName},${input.phone ?? null}) RETURNING id`;
    const profileId = String(profiles[0].id);
    for (const role of input.roles) await sql`INSERT INTO profile_roles(profile_id,role_id) SELECT ${profileId},id FROM roles WHERE code=${role} ON CONFLICT DO NOTHING`;
    const user = await this.findByUserId(userId);
    if (!user) throw new Error('No se pudo crear el usuario interno');
    return user;
  }

  async update(userId: string, input: UpdateInternalUserInput): Promise<BackofficeUser> {
    const sql = getDatabase();
    const p = await sql`SELECT id FROM profiles WHERE user_id=${userId} LIMIT 1`;
    if (!p[0]) throw new Error('Usuario no encontrado');
    const profileId = String(p[0].id);
    await sql`UPDATE profiles SET display_name=${input.displayName}, phone=${input.phone ?? null}, status=${input.status}, updated_at=now() WHERE id=${profileId}`;
    await sql`DELETE FROM profile_roles WHERE profile_id=${profileId}`;
    for (const role of input.roles) await sql`INSERT INTO profile_roles(profile_id,role_id) SELECT ${profileId},id FROM roles WHERE code=${role} ON CONFLICT DO NOTHING`;
    const user = await this.findByUserId(userId);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  async remove(userId: string) { const sql=getDatabase(); await sql`DELETE FROM users WHERE id=${userId}`; }
  async findByUserId(userId: string): Promise<BackofficeUser | null> {
    const all = await this.list(); return all.find((u)=>u.userId===userId) ?? null;
  }
  async writeAudit(actorProfileId: string, action: string, resourceId: string, metadata: Record<string, unknown> = {}) {
    const sql=getDatabase(); await sql`INSERT INTO audit_logs(actor_profile_id,action,resource_type,resource_id,metadata) VALUES (${actorProfileId},${action},'user',${resourceId},${JSON.stringify(metadata)}::jsonb)`;
  }
}
function mapUser(r: Record<string, unknown>): BackofficeUser { return { userId:String(r.user_id), profileId:String(r.profile_id), authSubject:r.auth_subject?String(r.auth_subject):null, email:String(r.email), displayName:String(r.display_name), phone:r.phone?String(r.phone):undefined, status:String(r.status)==='disabled'?'disabled':'active', roles:Array.isArray(r.roles)?r.roles.map(String) as RoleCode[]:[], createdAt:new Date(String(r.created_at)).toISOString() }; }
