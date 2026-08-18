'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

const INVALID_MESSAGE = 'Correo o contraseña incorrectos.';
const FALLBACK_MESSAGE = 'No fue posible iniciar sesión. Intenta nuevamente.';
const REMEMBERED_EMAIL_KEY = 'harmony:remembered-email';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (!rememberedEmail) return;

    setEmail(rememberedEmail);
    setRememberMe(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const normalizedEmail = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(INVALID_MESSAGE);
        return;
      }

      if (rememberMe) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      router.replace('/conversaciones');
      router.refresh();
    } catch {
      setError(FALLBACK_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="mt-7 space-y-4 sm:mt-8">
      <label htmlFor="email" className="block">
        <span className="mb-2 block text-sm font-medium text-neutral/80">Correo</span>
        <span className="flex min-h-13 items-center gap-3 rounded-xl border border-neutral/15 bg-neutral/4 px-4 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/12">
          <Mail size={18} className="shrink-0 text-neutral/40" aria-hidden="true" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="usuario@harmony.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-neutral outline-none placeholder:text-neutral/40"
          />
        </span>
      </label>

      <label htmlFor="password" className="block">
        <span className="mb-2 block text-sm font-medium text-neutral/80">Contraseña</span>
        <span className="flex min-h-13 items-center gap-3 rounded-xl border border-neutral/15 bg-neutral/4 pl-4 pr-1.5 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/12">
          <LockKeyhole size={18} className="shrink-0 text-neutral/40" aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={256}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-neutral outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-neutral/40 transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </span>
      </label>

      <div className="flex items-center justify-between gap-3 py-0.5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral/70">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-neutral/20 accent-primary"
          />
          <span>Recordarme en este dispositivo</span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/8 px-3.5 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-inset ring-danger/20">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-13 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-white shadow-sm transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando…' : 'Ingresar al backoffice'}
      </button>

      <p className="text-center text-sm leading-4 text-neutral/40">
        Harmony no guarda tu contraseña en este dispositivo; el navegador puede recordarla con su gestor de contraseñas.
      </p>
    </form>
  );
}
