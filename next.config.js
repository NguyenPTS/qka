/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wordpress.pharmatech.vn',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'mongoose'];
    return config;
  },
}

module.exports = nextConfig
//