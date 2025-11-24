import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Statikus export beállítása - HTML+CSS+JS fájlokat generál
  output: 'export',
  
  images: {
    // Statikus export esetén az image optimization nem elérhető
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      }
    ]
  }
};

export default nextConfig;
