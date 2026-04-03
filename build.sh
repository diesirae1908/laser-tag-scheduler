#!/usr/bin/env bash
set -e

echo "=== Node: $(node --version) ==="
echo "=== npm: $(npm --version) ==="

echo "--- Installing root dependencies ---"
npm install

echo "--- Installing client dependencies ---"
cd client
npm install

echo "--- Building client ---"
npm run build

echo "--- Build complete ---"
