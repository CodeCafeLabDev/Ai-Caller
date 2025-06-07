import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ Add this section to avoid cross-origin dev warnings
  allowedDevOrigins: [
    'https://3000-firebase-studio-1748844024640.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev'
  ],
};

export default nextConfig;
