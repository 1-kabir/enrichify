// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: false,
  },
  // Fix for reverse proxy origin header issues
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
