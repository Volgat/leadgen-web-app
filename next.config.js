/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration mise à jour pour Next.js 15.3.3
  serverExternalPackages: ['cheerio', 'axios'],
  
  // Configuration Turbopack (nouveau bundler de Next.js 15)
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Optimisations pour le scraping
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclure cheerio du bundle client
      config.externals = [...config.externals, 'cheerio'];
    }
    return config;
  },
  
  // Optimisation des images
  images: {
    domains: ['example.com'],
    unoptimized: true
  }
}

module.exports = nextConfig