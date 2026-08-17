import { UserAdminService } from '@/modules/users/application/user-admin-service';
import { NeonIdentityAdmin } from '@/modules/users/infrastructure/auth/neon-identity-admin';
import { PostgresUserRepository } from '@/modules/users/infrastructure/persistence/postgres-user-repository';

export const userAdminService = new UserAdminService(new PostgresUserRepository(), new NeonIdentityAdmin());
