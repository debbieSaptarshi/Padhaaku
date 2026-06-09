import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/chat", destination: `${apiUrl}/api/chat` },
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
