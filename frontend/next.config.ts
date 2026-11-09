import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next requires a finite byte value; use JavaScript's largest safe size.
  experimental: { proxyClientMaxBodySize: Number.MAX_SAFE_INTEGER },
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${process.env.API_BASE_URL ?? "http://localhost:8080"}/api/:path*`,
    }];
  },
};

export default nextConfig;
