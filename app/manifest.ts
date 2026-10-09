// src/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Halısaha İstatistik Uygulaması',
    short_name: 'Halısaha App',
    description: 'Halısaha ekibimizin maç ve oyuncu istatistikleri',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}