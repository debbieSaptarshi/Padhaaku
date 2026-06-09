import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@padhaaku/core",
    "@padhaaku/rag",
    "@padhaaku/knowledge",
    "@padhaaku/agents",
  ],
};

export default nextConfig;
