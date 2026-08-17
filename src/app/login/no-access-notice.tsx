'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function NoAccessNotice({ message, signedIn }: { message: string; signedIn: boolean }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleSignOut() {
    setLeaving(true);
    try {
      await authClient.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div role="status" className="mt-6 rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200">
      <div className="flex gap-2.5">
        <ShieldAlert size={15} className="mt-px shrink-0 text-amber-600" />
        <p className="text-[10px] leading-4 font-medium text-amber-900">{message}</p>
      </div>
      {signedIn ? (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={leaving}
          className="mt-2.5 text-[10px] font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-60"
        >
          {leaving ? 'Cerrando sesión…' : 'Cerrar sesión y usar otra cuenta'}
        </button>
      ) : null}
    </div>
  );
}
