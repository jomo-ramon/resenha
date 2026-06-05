import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid lockfile-detection ambiguity when other projects exist higher
  // up in the filesystem (e.g. a stray package-lock.json in ~).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
