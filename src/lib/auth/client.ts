'use client';

import { signOut } from 'next-auth/react';

/** Compatibility facade for legacy UI imports. Authentication is owned by Auth.js. */
export const authClient = {
  signOut: () => signOut({ redirect: false }),
};
