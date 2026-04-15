import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statikus export beállítása - HTML+CSS+JS fájlokat generál
  output: 'export',

  // Subpath deployment: simplyfire.ai/noilezer-admin alatt szolgáljuk
  // Minden asset hivatkozás (_next/static/...) ezzel a prefix-szel lesz generálva
  basePath: '/noilezer-admin',

  // Subpath + static export + nginx fallback miatt a trailing slash-es URL-ek
  // megbízhatóbbak (/noilezer-admin/users/ → /noilezer-admin/users/index.html)
  trailingSlash: true,

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
