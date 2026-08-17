import { auth } from '@/lib/auth/server';
import type { IdentityAdmin } from '../../application/ports/identity-admin';

type NeonAdminApi = {
  createUser(input: { email: string; password: string; name: string }): Promise<{ data?: { user?: { id: string; email: string; name?: string | null } }; error?: { message?: string } }>;
  removeUser(input: { userId: string }): Promise<{ error?: { message?: string } }>;
  banUser(input: { userId: string; banReason?: string }): Promise<{ error?: { message?: string } }>;
  unbanUser(input: { userId: string }): Promise<{ error?: { message?: string } }>;
};

export class NeonIdentityAdmin implements IdentityAdmin {
  private get admin(): NeonAdminApi {
    return auth.admin as unknown as NeonAdminApi;
  }

  async createUser(input: { email: string; password: string; name: string }) {
    const result = await this.admin.createUser(input);
    if (result.error) throw new Error(result.error.message ?? 'No se pudo crear la identidad');
    const user = result.data?.user;
    if (!user?.id) throw new Error('Neon Auth no devolvió el usuario creado');
    return { subject: user.id, email: user.email, name: user.name ?? input.name };
  }

  async removeUser(subject: string) {
    const result = await this.admin.removeUser({ userId: subject });
    if (result.error) throw new Error(result.error.message ?? 'No se pudo eliminar la identidad');
  }

  async setDisabled(subject: string, disabled: boolean) {
    const result = disabled
      ? await this.admin.banUser({ userId: subject, banReason: 'Disabled from Harmony Backoffice' })
      : await this.admin.unbanUser({ userId: subject });
    if (result.error) throw new Error(result.error.message ?? 'No se pudo actualizar el acceso');
  }
}
