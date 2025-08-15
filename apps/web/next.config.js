/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    domains: ['localhost', 'minio'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Use container URL in dev (Docker), allow override via API_BASE_URL
    const backendUrl = process.env.NODE_ENV === 'development'
      ? (process.env.API_BASE_URL || 'http://web:8000')
      : (process.env.API_BASE_URL || 'http://web:8000')
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/csrf',
        destination: `${backendUrl}/api/auth/csrf/`,
      },
    ];
  },
}

module.exports = nextConfig
