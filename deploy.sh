#!/usr/bin/env bash
# Buduje i wypycha dist/ na gałąź gh-pages (wymaga remote origin).
set -euo pipefail
source ~/.nvm/nvm.sh >/dev/null; nvm use >/dev/null 2>&1 || true
npm run build
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
touch "$tmp/.nojekyll"
url=$(git remote get-url origin)
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" commit -qm "Deploy $(date +%F\ %T)"
git -C "$tmp" push -f "$url" gh-pages
rm -rf "$tmp"
