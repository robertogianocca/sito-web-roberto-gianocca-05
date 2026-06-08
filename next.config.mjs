import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy.
// script-src includes 'unsafe-inline' for Next.js hydration scripts and 'unsafe-eval'
// in dev only (HMR). Upgrade to nonce-based CSP via middleware for stricter production security.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Images are served through /_next/image (relative), so 'self' covers all next/image usage.
  // data: and blob: are needed by some browser extensions and safe to include.
  // i.vimeocdn.com: VidStack fetches the Vimeo poster as a plain <img> (not via next/image).
  "img-src 'self' data: blob: https://i.vimeocdn.com",
  // next/font/google self-hosts fonts at build time; no runtime request to Google servers.
  "font-src 'self'",
  "frame-src player.vimeo.com",
  // vimeo.com: VidStack calls the oEmbed API to fetch video metadata (title, poster, duration).
  "connect-src 'self' https://vimeo.com",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Vimeo thumbnail CDN used by VideoCard thumbnailUrl field.
      // Add further hostnames here if you use thumbnail URLs from other providers.
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        pathname: "/**",
      },
    ],
    // quality=70 used in GallerySlideshow; 75 is the Next.js default fallback.
    qualities: [70, 75],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
