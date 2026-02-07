# Build Instructions

## Development Build

### Prerequisites
- Node.js 20+
- pnpm 9+
- Rust 1.75+

### Platform-Specific Requirements

**Windows:**
```powershell
# No additional requirements
```

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libssl-dev
```

### Development Server
```bash
pnpm install
pnpm tauri dev
```

## Production Builds

### Windows
```bash
pnpm tauri build --target x86_64-pc-windows-msvc
```
Outputs:
- `src-tauri/target/release/bundle/msi/Insyte_0.1.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/Insyte_0.1.0_x64-setup.exe`

### macOS (Intel)
```bash
pnpm tauri build --target x86_64-apple-darwin
```
Outputs:
- `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/Insyte_0.1.0_x64.dmg`

### macOS (Apple Silicon)
```bash
pnpm tauri build --target aarch64-apple-darwin
```
Outputs:
- `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Insyte_0.1.0_aarch64.dmg`

### Linux
```bash
pnpm tauri build --target x86_64-unknown-linux-gnu
```
Outputs:
- `src-tauri/target/release/bundle/deb/insyte_0.1.0_amd64.deb`
- `src-tauri/target/release/bundle/appimage/insyte_0.1.0_amd64.AppImage`

## Release Process

### 1. Update Version
```bash
# Update version in package.json and src-tauri/Cargo.toml
# Example: 0.1.0 -> 0.2.0
```

### 2. Tag Release
```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

### 3. CI Build
GitHub Actions will automatically:
- Build for all platforms
- Create release artifacts
- Publish GitHub release

### 4. Manual Build (if needed)
```bash
pnpm install
pnpm tauri build
```

## Troubleshooting

### Build fails on Linux
Ensure all system dependencies are installed:
```bash
sudo apt-get install -y build-essential curl wget git \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev
```

### Build fails on macOS
Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Build fails with Rust errors
Update Rust toolchain:
```bash
rustup update
```

## Distribution

Installers are located in:
- Windows: `src-tauri/target/release/bundle/msi/` and `nsis/`
- macOS: `src-tauri/target/[arch]/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/deb/` and `appimage/`

Upload to:
- GitHub Releases (automated via CI)
- Website download page
- Package managers (future)
