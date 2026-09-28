import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The "How it's checked" page became "About". Send old links there.
  async redirects() {
    return [{ source: "/how-its-checked", destination: "/about", permanent: true }];
  },
};

export default nextConfig;
