/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    // Prefer explicit env; otherwise, set prod default to EC2 domain and dev default to localhost
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (isProd ? 'http://veoliaint.atomiton.com:8000' : 'http://localhost:8000'),
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ETX Processor'
  }
}

module.exports = nextConfig
