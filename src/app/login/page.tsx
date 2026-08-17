import { redirect } from 'next/navigation';
import { getAccessState } from '@/lib/dal/auth';
import { LoginForm } from './login-form';
import { NoAccessNotice } from './no-access-notice';

export const dynamic = 'force-dynamic';

const DENIAL_MESSAGES: Record<string, string> = {
  'sin-perfil': 'Tu cuenta existe pero no tiene un perfil de acceso configurado.',
  'sesion-expirada': 'Tu sesión fue revocada. Inicia sesión nuevamente.',
  deshabilitado: 'Tu acceso al backoffice está deshabilitado.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ acceso?: string }> }) {
  const [access, params] = await Promise.all([getAccessState(), searchParams]);

  if (access.state === 'granted') redirect('/conversaciones');

  const reason = access.state === 'disabled'
    ? 'deshabilitado'
    : access.state === 'stale-session'
      ? 'sesion-expirada'
      : access.state === 'missing-profile'
        ? 'sin-perfil'
        : params.acceso;
  const notice = reason ? DENIAL_MESSAGES[reason] : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f5f2] px-4 py-10">
      <section className="w-full max-w-[420px] rounded-[28px] border border-zinc-200/80 bg-white p-7 shadow-[0_24px_70px_rgba(24,60,43,0.10)] sm:p-9">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-sm font-bold text-harmony-900">H</div>
          <div>
            <div className="text-lg font-semibold tracking-[-0.03em] text-harmony-900">Harmony</div>
            <div className="text-[10px] text-zinc-400">Backoffice</div>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-900">Bienvenido</h1>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">Ingresa con tu cuenta de Harmony.</p>
        </div>

        {notice ? <NoAccessNotice message={notice} signedIn={access.state !== 'anonymous'} /> : null}
        <LoginForm />
      </section>
    </main>
  );
}
