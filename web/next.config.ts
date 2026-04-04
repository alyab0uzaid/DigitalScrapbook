import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      { hostname: 'books.google.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'i.scdn.co' },
      { hostname: 'uwzcvvncuqnwflqsmewu.supabase.co' },
      { hostname: '**.googleusercontent.com' },
      { hostname: 'www.google.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
