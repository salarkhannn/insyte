# Insyte

Desktop-first analytics for people who work with data.

Insyte is a cross-platform desktop application that combines spreadsheet-grade data handling with AI-driven visualization. Load your CSV, Excel, or JSON files—ask questions in plain English—get charts that make sense.

## Downloads

<p>
  <a href="https://github.com/insyte-labs/insyte/releases/download/v0.1.0/insyte_0.1.0_amd64.deb">
    <img alt="Download for Ubuntu" src="https://img.shields.io/badge/Ubuntu-.deb%20Download-2ea44f?style=for-the-badge&logo=ubuntu&logoColor=white">
  </a>
  <img alt="Windows coming soon" src="https://img.shields.io/badge/Windows-Coming%20Soon-6b7280?style=for-the-badge&logo=windows&logoColor=white">
  <img alt="macOS coming soon" src="https://img.shields.io/badge/macOS-Coming%20Soon-6b7280?style=for-the-badge&logo=apple&logoColor=white">
</p>

Ubuntu users can install the current release directly from the GitHub release asset above. Windows and macOS packages are planned but not published yet.

## Why This Exists

Most analytics tools fall into one of two camps: browser-based dashboards that choke on large files, or heavyweight BI platforms that require a data team to operate. Insyte sits in the middle. It's built for analysts, founders, and anyone who needs to explore data without spinning up infrastructure.

The core idea is simple: you shouldn't need to know SQL or chart library APIs to answer "how did revenue change over the last quarter?" Just ask.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React + TypeScript                    │
│         UI Layer (AG Grid, ECharts, Radix UI)           │
├─────────────────────────────────────────────────────────┤
│                      Tauri 2.x IPC                       │
├─────────────────────────────────────────────────────────┤
│                         Rust                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │    Polars    │  │   Groq API   │  │   Project    │  │
│   │  (DataFrame) │  │  (LLM Query) │  │   System     │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Frontend**: React 19 with TypeScript. State lives in Zustand stores with TanStack Query handling async operations. AG Grid for data tables (handles 100k+ rows without breaking a sweat), ECharts for visualization.

**Backend**: Tauri 2.x with Rust. Polars does the heavy lifting for data processing—lazy evaluation means we're not loading entire datasets into memory. Groq API powers the natural language interface.

## Running Locally

Prerequisites:
- Node.js 20+
- Rust 1.75+
- pnpm

```bash
# Clone and install
git clone https://github.com/insyte-labs/insyte.git
cd insyte
pnpm install

# Development mode (hot reload)
pnpm tauri dev

# Production build
pnpm tauri build
```

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_api_key_here
```

## Project Structure

```
insyte/
├── src/                    # React frontend
│   ├── components/         # UI components (layout, data, visualization, ai)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Tauri IPC wrappers
│   ├── stores/             # Zustand state management
│   └── types/              # TypeScript definitions
├── src-tauri/              # Rust backend
│   └── src/
│       ├── ai/             # Groq integration, prompt engineering
│       ├── data/           # Ingestion, state, query execution
│       ├── project/        # Save/load project files
│       └── export/         # CSV/Excel export
└── public/                 # Static assets
```

## What Works Right Now

- **Data ingestion**: CSV, Excel (.xlsx), JSON (arrays and NDJSON)
- **Data exploration**: Sortable, filterable table view with virtual scrolling
- **AI queries**: Natural language → chart specification via Groq
- **Visualization**: Bar, line, area, pie, scatter charts
- **Project files**: Save/restore sessions as `.insyte` files
- **Multi-sheet support**: Work with multiple data sources in tabs
- **Export**: CSV and Excel output

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| UI Components | Radix UI, AG Grid, ECharts |
| State | Zustand, TanStack Query |
| Backend | Tauri 2.x, Rust |
| Data | Polars |
| AI | Groq API (Llama 3.x) |

## Building

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust 1.75+

### Platform-Specific Requirements

**Windows:**
```powershell
# No additional requirements - works out of the box
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

### Development Build
```bash
pnpm install
pnpm tauri dev
```

### Production Build

**Windows:**
```bash
pnpm tauri build --target x86_64-pc-windows-msvc
```
Outputs: `src-tauri/target/release/bundle/msi/` and `nsis/`

**macOS (Intel):**
```bash
pnpm tauri build --target x86_64-apple-darwin
```
Outputs: `src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/`

**macOS (Apple Silicon):**
```bash
pnpm tauri build --target aarch64-apple-darwin
```
Outputs: `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`

**Linux:**
```bash
pnpm tauri build --target x86_64-unknown-linux-gnu
```
Outputs:
- `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/insyte_0.1.0_amd64.deb`
- `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/insyte_0.1.0_amd64.AppImage`
- `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/rpm/insyte-0.1.0-1.x86_64.rpm`

### Troubleshooting

**Build fails on Linux:**
```bash
sudo apt-get install -y build-essential curl wget git \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev
```

**Build fails on macOS:**
```bash
xcode-select --install
```

**Build fails with Rust errors:**
```bash
rustup update
```

## License

MIT

---

Built by [Salar](https://github.com/salarkhannn)
