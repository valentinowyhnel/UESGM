// next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Only add this if you need to handle file-system modules
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    
    // Add path alias resolution
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias['@'] = path.resolve(__dirname, './');
    return config;
  },

  // Add empty turbopack config
  turbopack: {},

  // Other configurations
  compress: false,
  generateEtags: false,
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;