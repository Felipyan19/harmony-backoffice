import { z } from 'zod';

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido');

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().min(2).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
  logoUrl: z.string().trim().url().optional().or(z.literal('')).transform((value) => value || undefined),
  primaryColor: color,
  secondaryColor: color,
  accentColor: color,
  adminEmail: z.string().trim().toLowerCase().email(),
  adminDisplayName: z.string().trim().min(2).max(120),
  adminPassword: z.string().min(8).max(128),
});
