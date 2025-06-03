/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration corrigée pour Next.js 15.3.3
  serverExternalPackages: ['cheerio', 'axios'],
  
  // Optimisations Webpack pour le déploiement
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Externaliser les modules problématiques côté serveur
      config.externals = [...(config.externals || []), 'cheerio', 'canvas', 'jsdom'];
    }
    
    // Optimisations pour la production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true
  },
  
  // Configuration ESLint corrigée
  eslint: {
    dirs: ['app', 'lib'],
    ignoreDuringBuilds: false,
  },
  
  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Optimisations de performance
  compress: true,
  poweredByHeader: false,
  
  // Configuration des redirections si nécessaire
  async redirects() {
    return [];
  },
  
  // Configuration des en-têtes de sécurité
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig