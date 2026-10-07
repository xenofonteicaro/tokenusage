import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingExcludes: {
    "/*": ["./.local-data/**/*", "./artifacts/**/*", "./tests/**/*"],
  },
};

export default nextConfig;
