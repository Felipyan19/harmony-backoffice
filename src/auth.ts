import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const configuredEmail = process.env.AUTH_ADMIN_EMAIL?.trim().toLowerCase();
        const configuredPasswordHash = process.env.AUTH_ADMIN_PASSWORD_HASH;
        if (!configuredEmail || !configuredPasswordHash) return null;

        const email = parsed.data.email.trim().toLowerCase();
        if (email !== configuredEmail) return null;

        const passwordMatches = await compare(parsed.data.password, configuredPasswordHash);
        if (!passwordMatches) return null;

        return {
          id: 'harmony-admin',
          name: 'Administrador Harmony',
          email,
        };
      },
    }),
  ],
});
