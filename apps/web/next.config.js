/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep trailing slashes so API endpoints ending with '/' are preserved
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
    // Resolve backend URL:
    // - In development: always use localhost unless an explicit NEXT_PUBLIC_API_URL is provided
    //   (avoids pointing to Docker service host like "web" which isn't reachable from Next dev server)
    // - In production: use API_BASE_URL if set, otherwise fall back to docker service host
    const isDev = process.env.NODE_ENV === 'development'
    const backendUrl = isDev
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      : (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://web:8000')
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/csrf',
        destination: `${backendUrl}/api/auth/csrf/`,
      },
      {
        source: '/csrf/',
        destination: `${backendUrl}/api/auth/csrf/`,
      },
    ];
  },
}

module.exports = nextConfig
