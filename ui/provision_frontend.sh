#!/usr/bin/env bash
set -euo pipefail

APP_NAME="karma-aligns-spa"
PKG="${PKG:-npm}"   # override: PKG=pnpm ./provision_frontend.sh

echo "▶ Creating app folder: ${APP_NAME}"
if [ -d "${APP_NAME}" ]; then
  echo "  - Directory exists. Using it."
else
  mkdir -p "${APP_NAME}"
fi

echo "▶ Unpacking provided SPA template"
unzip -oq "$(dirname "$0")/karma-aligns-spa.zip" -d "${APP_NAME}"

cd "${APP_NAME}"
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local || true
fi

echo "▶ Installing dependencies with ${PKG}"
if [ "${PKG}" = "pnpm" ]; then
  command -v pnpm >/dev/null || (echo "Please install pnpm" && exit 1)
  pnpm i
elif [ "${PKG}" = "yarn" ]; then
  command -v yarn >/dev/null || (echo "Please install yarn" && exit 1)
  yarn
else
  npm i
fi

echo "▶ Running dev server"
if [ "${PKG}" = "pnpm" ]; then
  pnpm dev
elif [ "${PKG}" = "yarn" ]; then
  yarn dev
else
  npm run dev
fi
