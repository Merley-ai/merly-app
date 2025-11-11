/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Hardcoded environment variables for production
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.merley.co',
    BACKEND_URL: process.env.BACKEND_URL || 'https://api.merley.co',
  },
}

module.exports = nextConfig
