import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  outputFileTracingIncludes: {
    "/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  images: {
    qualities: [75, 100],
  },
};

export default nextConfig;
