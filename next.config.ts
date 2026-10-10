import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BASE44_PREVIEW_MODE === "1" && process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? {
        allowedDevOrigins: ["3000-" + process.env.BASE44_PUBLIC_HOST_SUFFIX],
      }
    : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
