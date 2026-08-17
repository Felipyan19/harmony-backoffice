import type { AccessProfile, PermissionCode, RoleCode } from '../../domain/access';

export interface LinkIdentityInput {
  provider: string;
  subject: string;
  email: string;
}

/**
 * Why an authenticated subject may still have no access profile. Authentication
 * (Neon Auth) and authorization (Harmony RBAC) are separate: holding a valid
 * session proves identity, never entitlement.
 */
export type AccessDenialReason =
  /** No `users` row for this email: nobody invited this person from the backoffice. */
  | 'not-invited'
  /** Invited, but no profile row yet — provisioning was left half-done. */
  | 'no-profile'
  /** The invited user is already linked to a different auth subject. Ops must relink it. */
  | 'subject-mismatch';

export type AccessResolution =
  | { granted: true; profile: AccessProfile }
  | { granted: false; reason: AccessDenialReason };

export interface AccessRepository {
  /**
   * Resolves the RBAC profile for an authenticated subject, linking the auth
   * identity to a pre-existing invited user on first sign-in. It never creates
   * users, profiles or role grants: provisioning belongs to the users module and
   * to the bootstrap script.
   */
  resolveIdentity(input: LinkIdentityInput): Promise<AccessResolution>;
  getByAuthIdentity(provider: string, subject: string): Promise<AccessProfile | null>;
  hasPermission(profileId: string, permission: PermissionCode): Promise<boolean>;
  assignRole(profileId: string, role: RoleCode, assignedBy?: string): Promise<void>;
}
