'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import {
  finalizeBootstrapAdminRepairAction,
  prepareBootstrapAdminRepairAction,
} from './actions';

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

      let result = await authClient.signIn.email({ email, password });

      if (result.error) {
        const repair = await prepareBootstrapAdminRepairAction({ email, password });

        if (repair.prepared) {
          const signup = await authClient.signUp.email({
            email,
            password,
            name: 'IgniteApps',
          });

          if (signup.error) {
            throw new Error('No se pudo recrear la identidad de acceso');
          }

          const finalized = await finalizeBootstrapAdminRepairAction({ email });
          if (!finalized.finalized) {
            throw new Error('No se pudo enlazar la identidad nueva');
          }

          result = await authClient.signIn.email({ email, password });
        }
      }

      if (result.error) {
        setError('Correo o contraseña incorrectos.');
        return;
      }

      router.replace('/conversaciones');
      router.refresh();
    } catch {
      setError('No fue posible iniciar sesión. Intenta nuevamente.');
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
