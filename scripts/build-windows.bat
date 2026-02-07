@echo off

echo Starting production build for Windows...

call pnpm tauri build --target x86_64-pc-windows-msvc

echo Build complete! Artifacts are in src-tauri\target\release\bundle\
