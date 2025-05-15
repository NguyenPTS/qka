/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
};

module.exports = nextConfig;
