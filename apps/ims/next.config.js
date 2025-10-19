/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // PWA Configuration
  ...(process.env.NODE_ENV === 'production' && {
    async headers() {
      return [
        {
          source: '/manifest.json',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/manifest+json',
            },
          ],
        },
      ];
    },
  }),

  // Image optimization
  images: {
    domains: [
      'localhost',
      'ims.partpal.co.za',
      'api.partpal.co.za',
      'res.cloudinary.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.partpal.co.za; frame-src 'self';",
          },
        ],
      },
    ];
  },

  // Environment variables for client
  env: {
    NEXT_PUBLIC_APP_NAME: 'PartPal IMS',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Professional inventory management system for scrap yards',
  },

  // Experimental features
  experimental: {
    // optimizeCss: true, // Disabled - causing issues with Tailwind CSS
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  // Compression and performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),
};

module.exports = nextConfig;