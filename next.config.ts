import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-a9a3038e-0bc0-49a9-b720-ac928ea6a901.space.z.ai",
  ],
};

export default nextConfig;
