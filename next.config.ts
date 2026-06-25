import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail the production build on lint warnings (e.g. exhaustive-deps).
  // TypeScript type-checking stays enabled.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
