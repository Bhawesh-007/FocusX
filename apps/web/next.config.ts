import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@focus/core', '@focus/db', '@focus/ui'],
};

export default nextConfig;
