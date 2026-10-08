import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/dev.db"],
  },
  turbopack: {
    resolveAlias: {
      "@titan/digital-twin": "./packages/digital-twin/src/index.ts",
    },
  },
};

export default nextConfig;
