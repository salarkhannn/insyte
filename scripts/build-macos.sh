#!/bin/bash

set -e

echo "Starting production build for macOS..."

if [[ $(uname -m) == 'arm64' ]]; then
    echo "Building for Apple Silicon..."
    pnpm tauri build --target aarch64-apple-darwin
else
    echo "Building for Intel..."
    pnpm tauri build --target x86_64-apple-darwin
fi

echo "Build complete! Artifacts are in src-tauri/target/*/release/bundle/"
