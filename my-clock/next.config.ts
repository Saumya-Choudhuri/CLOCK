import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/CLOCK',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
