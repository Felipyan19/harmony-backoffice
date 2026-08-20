import type { Metadata } from 'next';
import { Building2, Plus, ShieldCheck } from 'lucide-react';
import { getCurrentWorkspaceContext, requirePlatformStaff } from '@/lib/dal/auth';
import { Button, Panel, TextField } from '@/modules/shared/ui';
import { createWorkspaceAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Negocios' };

export default async function BusinessesPage() {
  await requirePlatformStaff(['owner', 'admin']);
  const context = await getCurrentWorkspaceContext();

  return (
    <div className="min-h-0 flex-1 overflow-auto p-5 md:p-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <section>
          <div className="mb-1 flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">Backoffices de Ignite</h2>
          </div>
          <p className="text-sm text-neutral/55">Cada negocio comparte la misma aplicación, pero sus usuarios, clientes, conversaciones y configuración quedan aislados por workspace.</p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <Panel className="overflow-hidden">
            <div className="border-b border-neutral/10 px-5 py-4">
              <div className="text-base font-semibold">Negocios disponibles</div>
              <div className="mt-1 text-sm text-neutral/45">{context.available.length} workspace{context.available.length === 1 ? '' : 's'}</div>
            </div>
            <div className="divide-y divide-neutral/10">
              {context.available.map((workspace) => (
                <div key={workspace.id} className="flex items-center gap-4 px-5 py-4">
                  {workspace.branding.logoUrl ? (
                    <img src={workspace.branding.logoUrl} alt="" className="h-11 w-11 rounded-xl border border-neutral/10 object-cover" />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-xl text-sm font-semibold text-white" style={{ background: workspace.branding.primaryColor }}>
                      {workspace.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold">{workspace.name}</div>
                    <div className="mt-0.5 text-sm text-neutral/45">/{workspace.slug}</div>
                  </div>
                  <div className="flex gap-1" aria-label="Colores del negocio">
                    {[workspace.branding.primaryColor, workspace.branding.secondaryColor, workspace.branding.accentColor].map((color) => (
                      <span key={color} className="h-5 w-5 rounded-full border border-neutral/10" style={{ background: color }} />
                    ))}
                  </div>
                  {workspace.id === context.current.id ? <span className="rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">Actual</span> : null}
                </div>
              ))}
            </div>
          </Panel>

          <form action={createWorkspaceAction} className="rounded-2xl border border-neutral/12 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={17} className="text-primary" />
              <div className="text-base font-semibold">Crear nuevo backoffice</div>
            </div>
            <div className="space-y-3">
              <TextField name="name" required placeholder="Nombre del negocio" />
              <TextField name="slug" required placeholder="slug-del-negocio" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
              <TextField name="logoUrl" type="url" placeholder="URL del logo (opcional)" />

              <div className="grid grid-cols-3 gap-3">
                <ColorField name="primaryColor" label="Principal" defaultValue="#33513a" />
                <ColorField name="secondaryColor" label="Oscuro" defaultValue="#22362a" />
                <ColorField name="accentColor" label="Acento" defaultValue="#b4894a" />
              </div>

              <div className="border-t border-neutral/10 pt-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral/70"><ShieldCheck size={14} />Administrador del negocio</div>
                <div className="space-y-3">
                  <TextField name="adminDisplayName" required placeholder="Nombre del administrador" />
                  <TextField name="adminEmail" type="email" required placeholder="Correo del administrador" />
                  <TextField name="adminPassword" type="password" minLength={8} required autoComplete="new-password" placeholder="Contraseña temporal" />
                </div>
                <p className="mt-2 text-sm text-neutral/40">Si el correo ya existe, se reutiliza su cuenta y solo se agrega la membresía al nuevo negocio.</p>
              </div>
            </div>
            <Button type="submit" className="mt-5 w-full">Crear backoffice</Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-sm text-neutral/55">
      <span className="mb-1 block">{label}</span>
      <input name={name} type="color" defaultValue={defaultValue} className="h-10 w-full rounded-lg border border-neutral/15 bg-white p-1" />
    </label>
  );
}
