# Deployment Guide - SimplyFire Admin Chatbot

## ⚡ Gyors válasz: Statikus HTML+CSS+JS fájlok

**A projekt most már statikus exportot generál!** 

A `npm run build` parancs után az **`out/`** mappa tartalmazza az összes statikus fájlt (HTML, CSS, JS), amit bármilyen statikus hostingon lehet hostolni:
- GitHub Pages
- Netlify
- Vercel (statikus)
- AWS S3 + CloudFront
- Bármilyen web szerver (nginx, Apache, stb.)

**Az `out/` mappa tartalmát kell csak elküldeni a DevOps-nak statikus hosting esetén!**

---

## Mit kell elküldeni a DevOps mérnöknek?

### ✅ BELEFOGYÓ FÁJLOK ÉS MAPPAK:

1. **Forráskód mappák:**
   - `src/` - Teljes forráskód mappa (komponensek, oldalak, szolgáltatások, típusok)
   - `public/` - Statikus fájlok (képek, stb.)

2. **Konfigurációs fájlok:**
   - `package.json` - Függőségek és scriptek definíciója
   - `package-lock.json` VAGY `pnpm-lock.yaml` - Pontos függőség verziók
   - `next.config.ts` - Next.js konfiguráció
   - `tsconfig.json` - TypeScript konfiguráció
   - `postcss.config.mjs` - PostCSS konfiguráció (Tailwind CSS-hez)
   - `eslint.config.mjs` - ESLint konfiguráció
   - `components.json` - shadcn/ui komponens konfiguráció
   - `next-env.d.ts` - Next.js TypeScript definíciók

3. **Root fájlok:**
   - `README.md` - Dokumentáció (opcionális, de ajánlott)

### ❌ NEM KELL BELEFOGYÓ:

- `node_modules/` - A szerveren telepítik: `npm install`
- `.next/` - Build output, a szerveren generálódik: `npm run build`
- `out/` - Statikus export (ha van)
- `.env`, `.env.local` - Environment változók (külön kell megadni)
- `certs/` - Helyi HTTPS tanúsítványok (nem kell production-ra)
- `.git/` - Git repository (ha Git-tel küldöd, akkor ez benne van)
- `.DS_Store`, `Thumbs.db` - OS fájlok
- IDE fájlok (`.vscode/`, `.idea/`)

## Deployment lépések (DevOps mérnöknek)

### Opció 1: Statikus hosting (AJÁNLOTT) ⭐

A projekt **statikus exportot** generál, ami azt jelenti, hogy csak HTML+CSS+JS fájlokat tartalmaz.

#### 1. Build futtatása (fejlesztői gépen)
```bash
npm install
npm run build
```

#### 2. Az `out/` mappa tartalmának hostolása
Az `out/` mappa tartalmazza az összes statikus fájlt:
- `out/index.html` - Főoldal
- `out/_next/static/` - CSS és JavaScript fájlok
- `out/` - Minden más statikus fájl

**Egyszerűen másold az `out/` mappa tartalmát a web szerverre!**

Példák:
- **nginx**: Másold az `out/` tartalmát a `/var/www/html/` mappába
- **Apache**: Másold az `out/` tartalmát a `/var/www/html/` mappába
- **GitHub Pages**: Push-old az `out/` mappa tartalmát a `gh-pages` branch-re
- **Netlify/Vercel**: Csatlakoztasd a Git repository-t, automatikusan build-eli

**Nincs szükség Node.js szerverre!** Csak egy statikus fájl szerver kell.

---

### Opció 2: Node.js szerver (ha később változtatnál)

Ha vissza szeretnéd állítani a Node.js szerveres működést:

1. **Változtasd meg a `next.config.ts`-t:**
   - Töröld ki az `output: 'export'` sort
   - Töröld ki az `images.unoptimized: true` sort

2. **Függőségek telepítése**
```bash
npm install
```

3. **Build futtatása**
```bash
npm run build
```
Ez létrehozza a `.next/` mappát a production build-tel.

4. **Alkalmazás indítása**
```bash
npm start
# vagy
npm run start
```
Ez a `next start` parancsot futtatja, ami a `.next/` mappát használja.

**Alapértelmezett port:** 3000 (vagy a `PORT` environment változó értéke)

## Docker deployment (opcionális)

Ha Docker-t használnak, létrehozhatsz egy `Dockerfile`-t is:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Fontos:** A Dockerfile használatához a `next.config.ts`-ben be kell állítani:
```typescript
output: 'standalone'
```

## Követelmények

- **Node.js:** 20.x vagy újabb
- **npm:** 9.x vagy újabb (vagy pnpm/yarn)
- **Port:** 3000 (vagy más, ha environment változóval beállítva)

## Production environment változók

Ha szükségesek environment változók, ezeket a DevOps mérnöknek külön kell beállítania:
- `NODE_ENV=production`
- `PORT=3000` (opcionális, alapértelmezett: 3000)

## Megjegyzések

- A `server.js` fájl csak helyi HTTPS fejlesztéshez szükséges, production-ban nem kell
- A `certs/` mappa csak helyi fejlesztéshez szükséges
- A build output (`.next/`) a szerveren generálódik, nem kell elküldeni

