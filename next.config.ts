import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://storage.googleapis.com https://placehold.co",
              "media-src 'self' blob: https://storage.googleapis.com",
              "connect-src 'self' http://localhost:5000 https://storage.googleapis.com",
              "font-src 'self' data:",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;


{/*
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
};

export default nextConfig;
*/}