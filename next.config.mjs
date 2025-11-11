/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'video-cdn.google.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' }
    ]
  },
};

export default nextConfig;
