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
  serverExternalPackages: ["body-parser"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Allow large file uploads (videos up to 50MB)
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
