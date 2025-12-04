'use strict'

/**
 * New Relic webpack externals loader
 * Ensures New Relic modules are not bundled by webpack
 */
const nrExternals = require('newrelic/load-externals')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
