import { EnsureAccessProfile } from '@/modules/access/application/use-cases/ensure-access-profile';
import { HasPermission } from '@/modules/access/application/use-cases/has-permission';
import { PostgresAccessRepository } from '@/modules/access/infrastructure/persistence/postgres-access-repository';

const accessRepository = new PostgresAccessRepository();

export const ensureAccessProfile = new EnsureAccessProfile(accessRepository);
export const hasPermission = new HasPermission(accessRepository);
export { accessRepository };
