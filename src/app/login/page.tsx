import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BrandIcon } from '@/components/brand-icon';
import { getAccessState } from '@/lib/dal/auth';
import { LoginForm } from './login-form';
import { NoAccessNotice } from './no-access-notice';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Iniciar sesión' };

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
      <div className="pointer-events-none absolute -left-24 top-[-7rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-primary/6 blur-3xl sm:h-96 sm:w-96" />

      <section className="relative w-full max-w-[440px] rounded-[24px] border border-neutral/12 bg-white/95 p-5 shadow-[0_24px_70px_rgba(24,60,43,0.10)] backdrop-blur sm:rounded-[28px] sm:p-9">
        <div className="flex items-center gap-3.5">
          <BrandIcon size={48} className="shrink-0 rounded-2xl shadow-sm" />
          <div>
            <div className="text-lg font-semibold tracking-[-0.03em] text-neutral">Harmony</div>
            <div className="mt-0.5 text-sm text-neutral/40">Backoffice</div>
          </div>
        </div>

        <div className="mt-7 sm:mt-9">
          <h1 className="text-lg font-semibold tracking-[-0.04em] text-neutral">Bienvenido</h1>
          <p className="mt-2 text-base leading-6 text-neutral/60">Ingresa con tu cuenta autorizada de Harmony.</p>
        </div>

        {notice ? <NoAccessNotice message={notice} signedIn={access.state !== 'anonymous'} /> : null}
        <LoginForm />
      </section>
    </main>
  );
}
