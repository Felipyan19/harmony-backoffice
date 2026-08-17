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
    <main className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#f4f5f2] px-3 py-4 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute -left-24 top-[-7rem] h-64 w-64 rounded-full bg-harmony-100/50 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-gold-100/40 blur-3xl sm:h-96 sm:w-96" />

      <section className="relative w-full max-w-[440px] rounded-[24px] border border-zinc-200/80 bg-white/95 p-5 shadow-[0_24px_70px_rgba(24,60,43,0.10)] backdrop-blur sm:rounded-[28px] sm:p-9">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-500 text-sm font-bold text-harmony-900 shadow-sm">H</div>
          <div>
            <div className="text-xl font-semibold tracking-[-0.03em] text-harmony-900">Harmony</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">Backoffice</div>
          </div>
        </div>

        <div className="mt-7 sm:mt-9">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-zinc-900 sm:text-3xl">Bienvenido</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 sm:text-[13px]">Ingresa con tu cuenta autorizada de Harmony.</p>
        </div>

        {notice ? <NoAccessNotice message={notice} signedIn={access.state !== 'anonymous'} /> : null}
        <LoginForm />
      </section>
    </main>
  );
}
