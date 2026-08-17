import { HasPermission } from '@/modules/access/application/use-cases/has-permission';
import { ResolveAccessProfile } from '@/modules/access/application/use-cases/resolve-access-profile';
import { PostgresAccessRepository } from '@/modules/access/infrastructure/persistence/postgres-access-repository';

const accessRepository = new PostgresAccessRepository();

export const resolveAccessProfile = new ResolveAccessProfile(accessRepository);
export const hasPermission = new HasPermission(accessRepository);
export { accessRepository };
