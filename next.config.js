/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  output: 'standalone',
  images: {
    domains: ['wordpress.pharmatech.vn'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wordpress.pharmatech.vn',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  }
}
//
module.exports = nextConfig
//