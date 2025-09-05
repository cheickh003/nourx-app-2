import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production builds to avoid blocking on plugin issues
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
