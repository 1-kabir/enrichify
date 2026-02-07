// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Fix for reverse proxy origin header issues
  skipTrailingSlashRedirect: true,
  // Empty turbopack config to silence webpack warning
  turbopack: {},
};

module.exports = nextConfig;
