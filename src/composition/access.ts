import { HasPermission } from '@/modules/access/application/use-cases/has-permission';
import { PostgresAccessRepository } from '@/modules/access/infrastructure/persistence/postgres-access-repository';

export const accessRepository = new PostgresAccessRepository();
export const hasPermission = new HasPermission(accessRepository);
