#!/bin/bash

set -e

echo "Starting production build for all platforms..."

echo "Building for Linux..."
pnpm tauri build --target x86_64-unknown-linux-gnu

echo "Build complete! Artifacts are in src-tauri/target/release/bundle/"
