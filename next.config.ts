import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingExcludes: {
    "/*": ["./.local-data/**/*", "./artifacts/**/*", "./tests/**/*"],
  },
};

export default nextConfig;
