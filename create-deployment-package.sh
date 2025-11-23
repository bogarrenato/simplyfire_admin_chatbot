#!/bin/bash
# Script a deployment package létrehozásához DevOps mérnöknek

PACKAGE_NAME="simplyfire-admin-chatbot-deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${PACKAGE_NAME}_${TIMESTAMP}"

echo "📦 Deployment package készítése..."
echo "Kimenet: ${OUTPUT_DIR}.zip"

# Mappa létrehozása
mkdir -p "${OUTPUT_DIR}"

# Szükséges fájlok másolása
echo "📋 Fájlok másolása..."

# Forráskód
cp -r src "${OUTPUT_DIR}/"
cp -r public "${OUTPUT_DIR}/"

# Konfigurációs fájlok
cp package.json "${OUTPUT_DIR}/"
cp package-lock.json "${OUTPUT_DIR}/" 2>/dev/null || cp pnpm-lock.yaml "${OUTPUT_DIR}/" 2>/dev/null || echo "⚠️  Nincs lock fájl"
cp next.config.ts "${OUTPUT_DIR}/"
cp tsconfig.json "${OUTPUT_DIR}/"
cp postcss.config.mjs "${OUTPUT_DIR}/"
cp eslint.config.mjs "${OUTPUT_DIR}/"
cp components.json "${OUTPUT_DIR}/"
cp next-env.d.ts "${OUTPUT_DIR}/"
cp README.md "${OUTPUT_DIR}/" 2>/dev/null || echo "⚠️  Nincs README.md"
cp DEPLOYMENT.md "${OUTPUT_DIR}/"

# ZIP készítése
zip -r "${OUTPUT_DIR}.zip" "${OUTPUT_DIR}" -x "*.DS_Store"

# Temp mappa törlése
rm -rf "${OUTPUT_DIR}"

echo "✅ Kész! A fájl: ${OUTPUT_DIR}.zip"
echo ""
echo "📤 Ezt a fájlt küldd el a DevOps mérnöknek."
