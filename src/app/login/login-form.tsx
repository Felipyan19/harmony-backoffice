'use client';

import { FormEvent, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Checkbox, TextField } from '@/modules/shared/ui';

const INVALID_MESSAGE = 'Correo o contraseña incorrectos.';
const FALLBACK_MESSAGE = 'No fue posible iniciar sesión. Intenta nuevamente.';
const REMEMBERED_EMAIL_KEY = 'harmony:remembered-email';

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getRememberedEmail() {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function getServerRememberedEmail() {
  return '';
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const rememberedEmail = useSyncExternalStore(subscribeToStorage, getRememberedEmail, getServerRememberedEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const normalizedEmail = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');
      const rememberMe = form.get('rememberMe') === 'on';

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
      <TextField
        id="email"
        name="email"
        type="email"
        size="lg"
        label="Correo"
        startAdornment={<Mail size={18} className="shrink-0 text-neutral/40" aria-hidden="true" />}
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        placeholder="usuario@harmony.com"
        defaultValue={rememberedEmail}
      />

      <TextField
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        size="lg"
        label="Contraseña"
        startAdornment={<LockKeyhole size={18} className="shrink-0 text-neutral/40" aria-hidden="true" />}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-neutral/40 transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        }
        autoComplete="current-password"
        required
        minLength={8}
        maxLength={256}
      />

      <div className="flex items-center justify-between gap-3 py-0.5">
        <Checkbox
          name="rememberMe"
          label="Recordarme en este dispositivo"
          defaultChecked={Boolean(rememberedEmail)}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-danger/8 px-3.5 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-inset ring-danger/20">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-13 w-full items-center justify-center rounded-xl bg-[var(--color-primary-dark)] px-4 text-base font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando…' : 'Ingresar al backoffice'}
      </button>

      <p className="text-center text-sm leading-4 text-neutral/40">
        Harmony no guarda tu contraseña en este dispositivo; el navegador puede recordarla con su gestor de contraseñas.
      </p>
    </form>
  );
}
