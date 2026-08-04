import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/dashboard": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
