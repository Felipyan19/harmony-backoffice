'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ShieldAlert } from 'lucide-react';

export function NoAccessNotice({ message, signedIn }: { message: string; signedIn: boolean }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleSignOut() {
    setLeaving(true);
    try {
      await signOut({ redirect: false });
      router.replace('/login');
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div role="status" className="mt-6 rounded-xl bg-warning/10 px-3.5 py-3 ring-1 ring-inset ring-warning/25">
      <div className="flex gap-2.5">
        <ShieldAlert size={15} className="mt-px shrink-0 text-warning" />
        <p className="text-sm leading-4 font-medium text-warning">{message}</p>
      </div>
      {signedIn ? (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={leaving}
          className="mt-2.5 text-sm font-semibold text-warning underline underline-offset-2 disabled:opacity-60"
        >
          {leaving ? 'Cerrando sesión…' : 'Cerrar sesión y usar otra cuenta'}
        </button>
      ) : null}
    </div>
  );
}
