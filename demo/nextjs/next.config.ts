import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   typescript: {
    ignoreBuildErrors: false,
  },

   reactStrictMode: false,
   poweredByHeader: false,
   productionBrowserSourceMaps: false,
   compress: true,
};

export default nextConfig;
