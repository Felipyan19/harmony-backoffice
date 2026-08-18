import { HasPermission } from '@/modules/access/application/use-cases/has-permission';
import { RolePermissionService } from '@/modules/access/application/role-permission-service';
import { PostgresAccessRepository } from '@/modules/access/infrastructure/persistence/postgres-access-repository';
import { PostgresRolePermissionRepository } from '@/modules/access/infrastructure/persistence/postgres-role-permission-repository';

export const accessRepository = new PostgresAccessRepository();
export const hasPermission = new HasPermission(accessRepository);
export const rolePermissionService = new RolePermissionService(new PostgresRolePermissionRepository());
