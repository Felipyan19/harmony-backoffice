'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Correo o contraseña incorrectos.',
  USER_BANNED: 'Tu acceso está deshabilitado. Contacta a un administrador.',
  EMAIL_NOT_VERIFIED: 'Debes verificar tu correo antes de ingresar.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos.',
};

const FALLBACK_MESSAGE = 'No fue posible iniciar sesión. Intenta nuevamente.';
const NETWORK_MESSAGE = 'No pudimos contactar el servicio de autenticación. Revisa tu conexión e intenta de nuevo.';

/**
 * Never report a transport failure as a credential failure: that mislabelling is
 * what makes a misconfigured environment look like a forgotten password.
 *
 * The client does not reliably surface the response body's `code`, so the message
 * and HTTP status are used as fallbacks — a 401 from sign-in is by definition a
 * rejected credential.
 */
function messageFor(error: { code?: string; message?: string; status?: number }) {
  const code = error.code ?? '';
  if (code.startsWith('NETWORK_')) return NETWORK_MESSAGE;
  if (MESSAGES[code]) return MESSAGES[code];

  const message = (error.message ?? '').toLowerCase();
  if (message.includes('invalid email or password')) return MESSAGES.INVALID_EMAIL_OR_PASSWORD;
  if (message.includes('banned')) return MESSAGES.USER_BANNED;
  if (message.includes('verif')) return MESSAGES.EMAIL_NOT_VERIFIED;

  if (error.status === 429) return MESSAGES.TOO_MANY_REQUESTS;
  if (error.status === 401 || error.status === 403) return MESSAGES.INVALID_EMAIL_OR_PASSWORD;
  return FALLBACK_MESSAGE;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get('email') ?? '').trim().toLowerCase();
      const password = String(form.get('password') ?? '');

      const { error: signInError } = await authClient.signIn.email({ email, password });

      if (signInError) {
        setError(messageFor(signInError));
        return;
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
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-[11px] font-medium text-zinc-700">Correo</span>
        <span className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 transition focus-within:border-harmony-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100">
          <Mail size={16} className="text-zinc-400" />
          <input name="email" type="email" autoComplete="email" required placeholder="usuario@harmony.com" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-zinc-400" />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-medium text-zinc-700">Contraseña</span>
        <span className="flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 transition focus-within:border-harmony-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-harmony-100">
          <LockKeyhole size={16} className="text-zinc-400" />
          <input name="password" type="password" autoComplete="current-password" required minLength={8} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
        </span>
      </label>

      {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-100">{error}</p> : null}

      <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl bg-harmony-800 text-[11px] font-semibold text-white shadow-sm transition hover:bg-harmony-900 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? 'Ingresando…' : 'Ingresar al backoffice'}
      </button>
    </form>
  );
}
