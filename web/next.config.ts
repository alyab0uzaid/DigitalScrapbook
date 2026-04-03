import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'books.google.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'i.scdn.co' },
    ],
  },
};

export default nextConfig;
