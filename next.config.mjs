/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // quality={1} (low-res placeholder) and quality={70} (final) used in GallerySlideshow.
    // Next.js 16 defaults to [75] only — values outside the list snap to nearest allowed.
    qualities: [1, 70, 75],
  },
};

export default nextConfig;
