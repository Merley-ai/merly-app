'use strict'

/**
 * New Relic webpack externals loader
 * Ensures New Relic modules are not bundled by webpack
 */
const nrExternals = require('newrelic/load-externals')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widget.intercom.io https://js.intercomcdn.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.intercomcdn.com https://*.intercom.io https://*.supabase.co https://*.supabase.in https://fal.media https://*.fal.media https://*.fal.ai https://lh3.googleusercontent.com https://images.unsplash.com",
              "font-src 'self' https://fonts.gstatic.com https://js.intercomcdn.com",
              "connect-src 'self' https://*.intercom.io https://*.intercomcdn.com wss://*.intercom.io https://*.supabase.co https://*.supabase.in https://*.fal.ai https://api.stripe.com",
              "frame-src https://intercom-sheets.com https://*.intercom.io https://js.stripe.com",
              "media-src 'self' https://js.intercomcdn.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [50, 75, 85, 90, 95, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: '**.fal.media',
      },
      {
        protocol: 'https',
        hostname: '**.fal.ai',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ],
  },

  env: {
    NEXT_PUBLIC_SAURON_API_URL: process.env.NEXT_PUBLIC_SAURON_API_URL,
    NEXT_PUBLIC_MELIAN_API_URL: process.env.NEXT_PUBLIC_MELIAN_API_URL,
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  /**
   * New Relic: Mark newrelic as external package for server components
   * Required for proper instrumentation in Next.js App Router
   */
  serverExternalPackages: ['newrelic'],

  /**
   * Webpack configuration for New Relic
   * Externalizes New Relic modules to prevent bundling issues
   */
  webpack: (config) => {
    nrExternals(config)
    return config
  },
}

module.exports = nextConfig
