/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration optimisée pour Vercel
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'axios']
  },
  
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
  
  // Configuration stricte pour éviter les erreurs de build
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Optimisations de performance
  compress: true,
  
  // Configuration des redirections si nécessaire
  async redirects() {
    return [];
  },
  
  // Configuration des en-têtes de sécurité
  async headers() {
    return [
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