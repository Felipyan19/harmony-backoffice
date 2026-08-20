import { passwordHasher } from '@/composition/authentication';
import { WorkspaceService } from '@/modules/workspaces/application/workspace-service';
import { PostgresWorkspaceRepository } from '@/modules/workspaces/infrastructure/persistence/postgres-workspace-repository';

export const workspaceRepository = new PostgresWorkspaceRepository();
export const workspaceService = new WorkspaceService(workspaceRepository, passwordHasher);
