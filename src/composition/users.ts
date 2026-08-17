import { passwordHasher } from '@/composition/authentication';
import { UserAdminService } from '@/modules/users/application/user-admin-service';
import { PostgresUserRepository } from '@/modules/users/infrastructure/persistence/postgres-user-repository';

export const userAdminService = new UserAdminService(new PostgresUserRepository(), passwordHasher);
