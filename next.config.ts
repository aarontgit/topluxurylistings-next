import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ disables blocking on ESLint errors in prod builds
  },
};

export default nextConfig;
