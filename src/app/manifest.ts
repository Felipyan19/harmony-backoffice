import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Harmony Backoffice',
    short_name: 'Harmony',
    description: 'Clientes, conversaciones y atención de Harmony Spa',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f2ee',
    theme_color: '#1c2b1f',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
