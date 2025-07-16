/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/voices',
        destination: 'http://localhost:5000/api/voices',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  images: {
    domains: ['placehold.co'],
  },
};

module.exports = nextConfig; 