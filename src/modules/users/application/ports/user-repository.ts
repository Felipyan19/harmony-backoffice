import type { RoleCode } from '@/modules/access/domain/access';
import type { BackofficeUser, RoleOption } from '../../domain/user';

export interface CreateInternalUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  phone?: string;
  roles: RoleCode[];
  actorProfileId?: string;
}

export interface UpdateInternalUserInput {
  displayName: string;
  phone?: string;
  status: 'active' | 'disabled';
  roles: RoleCode[];
  actorProfileId?: string;
}

export interface UserRepository {
  list(workspaceId: string): Promise<BackofficeUser[]>;
  listRoles(): Promise<RoleOption[]>;
  create(workspaceId: string, input: CreateInternalUserInput): Promise<BackofficeUser>;
  update(workspaceId: string, userId: string, input: UpdateInternalUserInput): Promise<BackofficeUser>;
  remove(workspaceId: string, userId: string): Promise<void>;
  findByUserId(workspaceId: string, userId: string): Promise<BackofficeUser | null>;
  writeAudit(workspaceId: string, actorProfileId: string, action: string, resourceId: string, metadata?: Record<string, unknown>): Promise<void>;
}
