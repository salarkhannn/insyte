# Insyte MVP — Implementation Plan

> **Goal:** Build a cross-platform desktop analytics app with AI-powered visualization in testable, incremental phases.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Tauri 2.x + Rust
- **Data Processing:** Polars
- **AI:** Groq API (Llama 3.x / Mixtral)
- **Charts:** Recharts
- **Tables:** AG Grid Community
- **State Management:** TanStack Query + Zustand
- **Dev Environment:** Ubuntu Linux

---

## Phase 0: Project Scaffolding & Environment Setup
**Duration:** 1-2 days

### 0.0 Ubuntu Development Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git

# Install Tauri system dependencies (required for Ubuntu)
sudo apt install -y libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev

# Install Node.js (v20 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node installation
node --version   # Should show v20.x.x
pnpm --version    # Should show 10.x.x

# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify Rust installation
rustc --version  # Should show 1.75+ 
cargo --version

# Optional: Install useful dev tools
sudo apt install -y pkg-config libxdo-dev
cargo install cargo-watch  # For auto-reload during development
```

**Test:** Run `rustc --version && node --version` — both should show versions.

### 0.1 Initialize Tauri + React Project
```bash
# Install Tauri CLI
cargo install create-tauri-app
pnpm create tauri-app@latest insyte -- --template react-ts

# Navigate and install dependencies
cd insyte
pnpm install
```

**Test:** Run `pnpm run tauri dev` → Should see default Tauri window with React content.

### 0.2 Configure Project Structure
```
insyte/
├── src/                      # React frontend
│   ├── components/
│   │   ├── layout/           # App shell, sidebar, toolbar
│   │   ├── data/             # Table, preview components
│   │   ├── visualization/    # Chart components
│   │   ├── ai/               # Query input, suggestions
│   │   └── common/           # Buttons, modals, icons
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand stores
│   ├── services/             # API calls to Tauri backend
│   ├── types/                # TypeScript interfaces
│   ├── utils/                # Helper functions
│   └── styles/               # Global CSS / Tailwind
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── commands/         # Tauri commands
│   │   ├── data/             # Data ingestion & processing
│   │   ├── ai/               # Groq API integration
│   │   ├── project/          # Project save/load
│   │   └── export/           # Export functionality
│   └── Cargo.toml
├── public/
└── package.json
```

**Test:** Folder structure created, app still runs without errors.

### 0.3 Install Frontend Dependencies
```bash
pnpm install recharts ag-grid-react ag-grid-community
pnpm install @tanstack/react-query zustand
pnpm install tailwindcss postcss autoprefixer
pnpm install lucide-react                    # Icons
pnpm install @radix-ui/react-dialog          # Modals
pnpm install @radix-ui/react-dropdown-menu   # Dropdowns
pnpm install @radix-ui/react-tabs            # Tabs
pnpm install @radix-ui/react-tooltip         # Tooltips
pnpm install react-hot-toast                 # Notifications
pnpm install clsx tailwind-merge             # Class utilities
npx tailwindcss init -p
```

**Test:** Import one component from each library in App.tsx, verify no build errors.

### 0.4 Configure Rust Dependencies (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = ["dialog", "fs", "shell"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
polars = { version = "0.43", features = ["lazy", "csv", "json", "xlsx", "dtype-datetime"] }
calamine = "0.26"
reqwest = { version = "0.12", features = ["json"] }
csv = "1.3"
rust_xlsxwriter = "0.79"
thiserror = "2"
anyhow = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
directories = "5"
```

**Test:** `cargo check` in `src-tauri/` passes without errors.

---

## Phase 1: Application Shell & Layout
**Duration:** 2-3 days

### 1.1 Create Base Layout (PowerBI-inspired)
Build a professional app shell with:
- **Top Toolbar:** File operations, view toggles
- **Left Sidebar:** Data fields panel, collapsible
- **Main Canvas:** Central visualization area
- **Bottom Status Bar:** Data info, processing status

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Insyte    │ File │ View │ Help │    [Min][Max][X]│
├────────┬─────────────────────────────────────────────────┤
│ Fields │                                                 │
│ ────── │           Main Canvas Area                      │
│ □ col1 │                                                 │
│ □ col2 │     ┌─────────────────────────────────┐        │
│ □ col3 │     │                                 │        │
│        │     │    [Chart / Table / Empty]      │        │
│ ────── │     │                                 │        │
│ Viz    │     └─────────────────────────────────┘        │
│ ────── │                                                 │
│ [bar]  │  ┌─────────────────────────────────────────┐   │
│ [line] │  │  🤖 Ask: "Show revenue by month..."     │   │
│ [pie]  │  └─────────────────────────────────────────┘   │
├────────┴─────────────────────────────────────────────────┤
│ Ready │ Rows: 0 │ Columns: 0 │ Memory: 0 MB              │
└──────────────────────────────────────────────────────────┘
```

**Components to build:**
- `AppShell.tsx` — Main layout container
- `Toolbar.tsx` — Top action bar
- `Sidebar.tsx` — Collapsible left panel
- `FieldsPanel.tsx` — Data column list
- `Canvas.tsx` — Main content area
- `StatusBar.tsx` — Bottom info bar
- `QueryInput.tsx` — AI prompt input

**Test:** 
- App renders with all layout sections visible
- Sidebar can collapse/expand
- Responsive behavior on window resize

### 1.2 Implement Theme & Design System
Create a cohesive PowerBI-like visual style:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // PowerBI-inspired palette
        primary: '#217346',      // Green accent
        secondary: '#605E5C',    // Gray
        surface: '#FAF9F8',      // Light background
        canvas: '#FFFFFF',       // White canvas
        sidebar: '#F3F2F1',      // Sidebar bg
        border: '#EDEBE9',       // Subtle borders
        text: {
          primary: '#323130',
          secondary: '#605E5C',
          disabled: '#A19F9D',
        }
      }
    }
  }
}
```

**Test:** UI has consistent colors, spacing, and typography.

### 1.3 State Management Setup
```typescript
// stores/appStore.ts
interface AppState {
  // Data state
  dataLoaded: boolean;
  fileName: string | null;
  columns: Column[];
  rowCount: number;
  
  // UI state
  sidebarCollapsed: boolean;
  activeView: 'table' | 'chart';
  isProcessing: boolean;
  
  // Visualization state
  currentVisualization: VisualizationSpec | null;
  
  // Project state
  projectPath: string | null;
  isDirty: boolean;
}
```

**Test:** State updates reflect in UI, persists during session.

---

## Phase 2: Data Ingestion (Backend)
**Duration:** 3-4 days

### 2.1 File Dialog & Selection
Implement Tauri command for file picker:

```rust
// src-tauri/src/commands/file.rs
#[tauri::command]
pub async fn open_file_dialog() -> Result<Option<String>, String> {
    // Opens native file dialog
    // Filters: CSV, Excel, JSON
    // Returns selected file path
}
```

**Test:** Click "Open File" → Native dialog appears → Select file → Path returned to frontend.

### 2.2 CSV Ingestion
```rust
// src-tauri/src/data/ingest.rs
#[tauri::command]
pub async fn load_csv(path: String) -> Result<DatasetInfo, DataError> {
    // 1. Read CSV with Polars
    // 2. Infer column types
    // 3. Return schema + preview (first 100 rows)
    // 4. Store full DataFrame in app state
}
```

**DatasetInfo structure:**
```rust
pub struct DatasetInfo {
    pub columns: Vec<ColumnInfo>,
    pub row_count: usize,
    pub preview: Vec<Vec<serde_json::Value>>, // First 100 rows
    pub file_name: String,
    pub file_size: u64,
}

pub struct ColumnInfo {
    pub name: String,
    pub dtype: String,        // "string", "integer", "float", "date", "boolean"
    pub nullable: bool,
    pub sample_values: Vec<String>,
}
```

**Test:** 
- Load `test.csv` with 1000 rows
- Verify column types detected correctly
- Preview shows first 100 rows
- Status bar shows row/column count

### 2.3 Excel Ingestion
```rust
#[tauri::command]
pub async fn load_excel(path: String, sheet: Option<String>) -> Result<DatasetInfo, DataError> {
    // 1. List available sheets
    // 2. Load specified sheet (or first)
    // 3. Convert to Polars DataFrame
    // 4. Return schema + preview
}

#[tauri::command]
pub async fn list_excel_sheets(path: String) -> Result<Vec<String>, DataError> {
    // Return list of sheet names
}
```

**Test:**
- Load multi-sheet Excel file
- Sheet selector dropdown appears
- Correct sheet data loads

### 2.4 JSON Ingestion
```rust
#[tauri::command]
pub async fn load_json(path: String) -> Result<DatasetInfo, DataError> {
    // 1. Parse JSON (array of objects or newline-delimited)
    // 2. Flatten nested structures (1 level)
    // 3. Convert to DataFrame
    // 4. Return schema + preview
}
```

**Test:**
- Load JSON array file
- Nested objects flatten to `parent.child` columns
- Types inferred correctly

### 2.5 Data State Management (Backend)
```rust
// src-tauri/src/data/state.rs
pub struct DataState {
    current_df: Option<LazyFrame>,
    original_df: Option<LazyFrame>,
    transformations: Vec<Transformation>,
}

impl DataState {
    pub fn get_current(&self) -> Option<&LazyFrame>;
    pub fn apply_transformation(&mut self, t: Transformation);
    pub fn reset_to_original(&mut self);
}
```

**Test:** Data persists across multiple operations in same session.

---

## Phase 3: Data Preview & Table View
**Duration:** 2-3 days

### 3.1 AG Grid Integration
```typescript
// components/data/DataTable.tsx
interface DataTableProps {
  columns: ColumnDef[];
  rowData: any[];
  onColumnSelect?: (column: string) => void;
}

// Features to enable:
// - Virtual scrolling (handle 100k+ rows)
// - Column sorting
// - Column filtering
// - Column resizing
// - Row selection
```

**Test:**
- Load 100,000 row CSV
- Table renders smoothly
- Sorting works on all column types
- Filtering works correctly

### 3.2 Pagination & Virtual Loading
```rust
#[tauri::command]
pub async fn get_data_page(
    offset: usize,
    limit: usize,
    sort_by: Option<String>,
    sort_desc: bool,
    filters: Vec<FilterSpec>,
) -> Result<DataPage, DataError> {
    // Return paginated data for table view
}
```

**Test:** Scroll through 100k rows without lag.

### 3.3 Fields Panel
```typescript
// components/data/FieldsPanel.tsx
// Display all columns with:
// - Type icon (Σ for numeric, Aa for text, 📅 for date)
// - Column name
// - Drag handle (future: drag to viz)
// - Click to select/highlight
```

**Test:** All columns appear in sidebar with correct type indicators.

---

## Phase 4: AI Integration (Groq)
**Duration:** 3-4 days

### 4.1 Groq API Client
```rust
// src-tauri/src/ai/groq.rs
pub struct GroqClient {
    api_key: String,
    base_url: String,
    model: String, // "meta-llama/llama-4-maverick-17b-128e-instruct"
}

impl GroqClient {
    pub async fn complete(&self, prompt: String) -> Result<String, AIError>;
}
```

**Environment setup:**
```bash
# .env file (not committed)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

```rust
// Load API key from environment or settings
#[tauri::command]
pub async fn set_api_key(key: String) -> Result<(), String>;

#[tauri::command]
pub async fn validate_api_key() -> Result<bool, String>;
```

**Test:** 
- API key is in the .env file
- Make test completion call
- Verify response received

### 4.2 Prompt Engineering
```rust
// src-tauri/src/ai/prompts.rs
pub fn build_visualization_prompt(
    user_query: &str,
    schema: &DatasetSchema,
) -> String {
    format!(r#"
You are a data visualization assistant. Given a dataset schema and a user question, 
output a JSON specification for a chart.

DATASET SCHEMA:
{schema_json}

USER QUESTION: {user_query}

RULES:
1. Output ONLY valid JSON, no explanation
2. Use exact column names from schema
3. Choose appropriate chart type: bar, line, area, pie, scatter
4. Include aggregation when needed: sum, avg, count, min, max
5. For time series, use line or area charts
6. For comparisons, use bar charts
7. For proportions, use pie charts
8. For correlations, use scatter charts

OUTPUT FORMAT:
{{
  "chart_type": "bar|line|area|pie|scatter",
  "x_field": "column_name",
  "y_field": "column_name",
  "aggregation": "sum|avg|count|min|max|none",
  "group_by": "column_name" | null,
  "sort_by": "x|y|none",
  "sort_order": "asc|desc",
  "title": "Generated title for the chart",
  "filters": []
}}
"#, schema_json = serde_json::to_string_pretty(schema).unwrap(), user_query = user_query)
}
```

**Test:** Send sample queries, verify JSON output is valid and sensible.

### 4.3 Query Processing Pipeline
```rust
#[tauri::command]
pub async fn process_ai_query(query: String) -> Result<VisualizationSpec, AIError> {
    // 1. Get current dataset schema
    // 2. Build prompt
    // 3. Call Groq API
    // 4. Parse JSON response
    // 5. Validate against schema (columns exist, types compatible)
    // 6. Return validated spec
}
```

**Validation checks:**
- All referenced columns exist
- Aggregation valid for column type
- Chart type appropriate for data types

**Test:**
- "Show total sales by region" → Valid bar chart spec
- "Revenue over time" → Valid line chart spec
- Invalid column name → Helpful error message

### 4.4 Query Input Component
```typescript
// components/ai/QueryInput.tsx
// - Text input with placeholder examples
// - Send button (Enter to submit)
// - Loading state during API call
// - Error display for failed queries
// - Query history dropdown
```

**Test:**
- Type query and press Enter
- Loading spinner appears
- Result populates or error shows

---

## Phase 5: Data Processing Engine
**Duration:** 2-3 days

### 5.1 Polars Query Execution
```rust
// src-tauri/src/data/query.rs
#[tauri::command]
pub async fn execute_visualization_query(
    spec: VisualizationSpec,
) -> Result<ChartData, DataError> {
    // 1. Get current DataFrame
    // 2. Apply filters
    // 3. Group by x_field
    // 4. Apply aggregation to y_field
    // 5. Sort results
    // 6. Return data for charting
}

pub struct ChartData {
    pub labels: Vec<String>,           // X-axis values
    pub datasets: Vec<Dataset>,        // Y-axis data series
    pub metadata: ChartMetadata,
}

pub struct Dataset {
    pub label: String,
    pub data: Vec<f64>,
    pub color: Option<String>,
}
```

**Test:**
- Sum of sales by month → Correct totals
- Average price by category → Correct averages
- Count of orders by status → Correct counts

### 5.2 Filter Operations
```rust
pub struct FilterSpec {
    pub column: String,
    pub operator: FilterOperator,
    pub value: serde_json::Value,
}

pub enum FilterOperator {
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
    Contains,
    StartsWith,
    Between,
    In,
    IsNull,
    IsNotNull,
}
```

**Test:** Apply multiple filters, verify data correctly filtered.

### 5.3 Aggregation Operations
```rust
pub fn apply_aggregation(
    df: LazyFrame,
    group_col: &str,
    agg_col: &str,
    agg_type: AggregationType,
) -> Result<DataFrame, DataError> {
    match agg_type {
        AggregationType::Sum => df.group_by([col(group_col)]).agg([col(agg_col).sum()]),
        AggregationType::Avg => df.group_by([col(group_col)]).agg([col(agg_col).mean()]),
        AggregationType::Count => df.group_by([col(group_col)]).agg([col(agg_col).count()]),
        AggregationType::Min => df.group_by([col(group_col)]).agg([col(agg_col).min()]),
        AggregationType::Max => df.group_by([col(group_col)]).agg([col(agg_col).max()]),
        AggregationType::None => df.select([col(group_col), col(agg_col)]),
    }
}
```

**Test:** Each aggregation type produces correct results.

---

## Phase 6: Visualization Layer
**Duration:** 3-4 days

### 6.1 Chart Container
```typescript
// components/visualization/ChartContainer.tsx
interface ChartContainerProps {
  spec: VisualizationSpec;
  data: ChartData;
  onRefresh: () => void;
}

// Features:
// - Responsive sizing
// - Loading overlay
// - Error boundary
// - Chart title display
// - Toolbar (refresh, export, fullscreen)
```

**Test:** Container renders correctly at different sizes.

### 6.2 Bar Chart
```typescript
// components/visualization/charts/BarChart.tsx
// Using Recharts:
// - Vertical and horizontal variants
// - Proper axis labels
// - Tooltips on hover
// - Legend for grouped bars
// - Animation on load
```

**Test:** 
- Renders with sample data
- Hover shows tooltip with values
- Handles 50+ bars gracefully

### 6.3 Line Chart
```typescript
// components/visualization/charts/LineChart.tsx
// Features:
// - Smooth curves option
// - Data point markers
// - Grid lines
// - Axis formatting (dates, numbers)
// - Multi-line support
```

**Test:** Time series data renders as connected line.

### 6.4 Area Chart
```typescript
// components/visualization/charts/AreaChart.tsx
// Features:
// - Filled area under line
// - Gradient fill option
// - Stacked areas for multiple series
```

**Test:** Area fills correctly between line and axis.

### 6.5 Pie Chart
```typescript
// components/visualization/charts/PieChart.tsx
// Features:
// - Proper slice sizing
// - Labels with percentages
// - Legend
// - Hover highlight
// - Donut variant option
```

**Test:** Slices proportional to values, percentages correct.

### 6.6 Scatter Chart
```typescript
// components/visualization/charts/ScatterChart.tsx
// Features:
// - Point sizing
// - Quadrant lines (optional)
// - Trend line (future)
// - Zoom/pan (future)
```

**Test:** Points plotted at correct coordinates.

### 6.7 Chart Theme & Styling
```typescript
// utils/chartTheme.ts
export const CHART_COLORS = [
  '#217346', // Primary green
  '#0078D4', // Blue
  '#E74856', // Red
  '#FFB900', // Yellow
  '#8764B8', // Purple
  '#00B294', // Teal
  '#FF8C00', // Orange
];

export const chartTheme = {
  fontFamily: 'Segoe UI, system-ui, sans-serif',
  fontSize: 12,
  axis: {
    stroke: '#605E5C',
    tickColor: '#A19F9D',
  },
  grid: {
    stroke: '#EDEBE9',
  },
};
```

**Test:** Charts match PowerBI visual style.

---

## Phase 7: View Toggle & Canvas
**Duration:** 1-2 days

### 7.1 View Switcher
```typescript
// components/layout/ViewSwitcher.tsx
// Toggle between:
// - Table view (full AG Grid)
// - Chart view (visualization)
// - Split view (future: side by side)
```

**Test:** Toggle switches view smoothly with animation.

### 7.2 Empty States
```typescript
// components/common/EmptyState.tsx
// States:
// - No data loaded: "Import a file to get started"
// - Data loaded, no viz: "Ask a question to create a visualization"
// - Error state: "Something went wrong" + retry
```

**Test:** Appropriate empty state shows for each scenario.

### 7.3 Canvas Polish
- Subtle shadow around chart container
- Padding and margins match PowerBI
- Responsive behavior
- Print-friendly layout

**Test:** UI looks professional and polished.

---

## Phase 8: Project System
**Duration:** 2-3 days

### 8.1 Project File Format
```rust
// src-tauri/src/project/schema.rs
#[derive(Serialize, Deserialize)]
pub struct InsyteProject {
    pub version: String,                    // "1.0"
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub data: ProjectData,
    pub visualization: Option<VisualizationSpec>,
    pub query_history: Vec<QueryHistoryItem>,
}

#[derive(Serialize, Deserialize)]
pub struct ProjectData {
    pub source_type: DataSourceType,        // embedded | path
    pub source_path: Option<String>,        // Original file path
    pub embedded_data: Option<String>,      // Base64 encoded if embedded
    pub schema: DatasetSchema,
}
```

**Test:** Create project struct, serialize to JSON, verify readable.

### 8.2 Save Project
```rust
#[tauri::command]
pub async fn save_project(path: Option<String>) -> Result<String, ProjectError> {
    // 1. If no path, open save dialog
    // 2. Serialize current state
    // 3. Write to .insyte file
    // 4. Update project path in state
    // 5. Return saved path
}

#[tauri::command]
pub async fn save_project_as() -> Result<String, ProjectError> {
    // Always open save dialog for new location
}
```

**Keyboard shortcuts:**
- `Ctrl+S` → Save
- `Ctrl+Shift+S` → Save As

**Test:**
- Save new project → File dialog appears → File created
- Save existing → Overwrites without dialog
- Verify .insyte file contains correct JSON

### 8.3 Open Project
```rust
#[tauri::command]
pub async fn open_project(path: Option<String>) -> Result<InsyteProject, ProjectError> {
    // 1. If no path, open file dialog (.insyte filter)
    // 2. Read and parse file
    // 3. Validate version compatibility
    // 4. Restore data (embedded or reload from path)
    // 5. Restore visualization
    // 6. Return project state
}
```

**Test:**
- Open saved project → State fully restored
- Visualization appears exactly as saved
- Data matches original

### 8.4 New Project / Close
```rust
#[tauri::command]
pub async fn new_project() -> Result<(), ProjectError> {
    // 1. If unsaved changes, prompt to save
    // 2. Clear all state
    // 3. Reset to empty state
}

#[tauri::command]
pub async fn close_project() -> Result<(), ProjectError> {
    // Same as new_project
}
```

**Test:**
- New with unsaved changes → Save prompt appears
- Confirm → State cleared
- Cancel → Returns to current state

### 8.5 Recent Projects
```rust
#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<RecentProject>, ProjectError> {
    // Read from app data directory
    // Return last 10 projects
}

#[tauri::command]
pub async fn add_to_recent(path: String) -> Result<(), ProjectError>;
```

**Test:** Open project → Appears in recent list → Click to reopen.

---

## Phase 9: Export Functionality
**Duration:** 2-3 days

### 9.1 Export Processed Data as CSV
```rust
#[tauri::command]
pub async fn export_csv(path: Option<String>) -> Result<String, ExportError> {
    // 1. Get current (transformed) DataFrame
    // 2. Open save dialog if no path
    // 3. Write CSV
    // 4. Return path
}
```

**Test:** Export → Open in Excel → Data matches table view.

### 9.2 Export as Excel
```rust
#[tauri::command]
pub async fn export_excel(path: Option<String>) -> Result<String, ExportError> {
    // Using rust_xlsxwriter:
    // 1. Create workbook
    // 2. Add worksheet with data
    // 3. Apply basic formatting (headers bold, auto-width)
    // 4. Save file
}
```

**Test:** Export → Open in Excel → Formatted correctly.

### 9.3 Export Chart as PDF
```rust
#[tauri::command]
pub async fn export_pdf(path: Option<String>) -> Result<String, ExportError> {
    // Option A: Use webview screenshot + printpdf
    // Option B: Use headless_chrome for full render
    // Include: Chart, title, timestamp, data summary
}
```

**Frontend support:**
```typescript
// Trigger PDF export from chart container
const handleExportPDF = async () => {
  const path = await invoke('export_pdf');
  toast.success(`Exported to ${path}`);
};
```

**Test:** Export → Open PDF → Chart renders clearly.

### 9.4 Export Menu
```typescript
// components/layout/ExportMenu.tsx
// Dropdown with options:
// - Export Data as CSV
// - Export Data as Excel
// - Export Chart as PDF
// - (Disabled: PPTX - Coming Soon)
```

**Test:** Menu opens, each option triggers correct export.

---

## Phase 10: Settings & Preferences
**Duration:** 1-2 days

### 10.1 Settings Storage
```rust
// src-tauri/src/settings/mod.rs
#[derive(Serialize, Deserialize)]
pub struct AppSettings {
    pub groq_api_key: Option<String>,
    pub default_chart_type: String,
    pub theme: String,                      // "light" | "dark" (future)
    pub recent_projects: Vec<String>,
    pub auto_save: bool,
    pub max_preview_rows: usize,
}

#[tauri::command]
pub async fn get_settings() -> Result<AppSettings, SettingsError>;

#[tauri::command]
pub async fn update_settings(settings: AppSettings) -> Result<(), SettingsError>;
```

**Test:** Change setting → Restart app → Setting persists.

### 10.2 Settings Dialog
```typescript
// components/settings/SettingsDialog.tsx
// Tabs:
// - General: Auto-save, preview rows
// - AI: API key (masked input), model selection
// - About: Version, credits
```

**Test:** Open settings → Change API key → Verify API calls use new key.

---

## Phase 11: Error Handling & Polish
**Duration:** 2-3 days

### 11.1 Global Error Handling
```typescript
// components/common/ErrorBoundary.tsx
// Catches React errors, shows friendly message

// hooks/useErrorHandler.ts
// Centralized error handling for Tauri calls
```

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum InsyteError {
    #[error("Data error: {0}")]
    Data(#[from] DataError),
    #[error("AI error: {0}")]
    AI(#[from] AIError),
    #[error("Project error: {0}")]
    Project(#[from] ProjectError),
    #[error("Export error: {0}")]
    Export(#[from] ExportError),
}
```

**Test:** Trigger various errors → User sees helpful messages, not crashes.

### 11.2 Loading States
```typescript
// components/common/LoadingOverlay.tsx
// Full-screen or component-level loading indicators

// States to handle:
// - Loading file
// - Processing AI query
// - Executing data query
// - Exporting
// - Saving project
```

**Test:** All async operations show loading feedback.

### 11.3 Toast Notifications
```typescript
// Success: "Project saved", "Data exported"
// Error: "Failed to load file", "AI request failed"
// Info: "Processing 100,000 rows..."
```

**Test:** Actions trigger appropriate toasts.

### 11.4 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save project |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+E` | Export |
| `Ctrl+N` | New project |
| `Ctrl+/` | Focus query input |
| `Escape` | Cancel/close dialog |

**Test:** Each shortcut triggers correct action.

### 11.5 Accessibility
- Tab navigation works
- ARIA labels on interactive elements
- Sufficient color contrast
- Focus indicators visible

**Test:** Navigate entire app with keyboard only.

---

## Phase 12: Testing & Quality
**Duration:** 2-3 days

### 12.1 Unit Tests (Rust)
```rust
// Tests for:
// - CSV parsing
// - Excel parsing  
// - JSON parsing
// - Aggregation functions
// - Filter operations
// - Project serialization
```

```bash
cargo test
```

### 12.2 Integration Tests
```rust
// Test full flows:
// - Load file → Query → Get chart data
// - Save project → Load project → Verify state
// - Export data → Verify file contents
```

### 12.3 Frontend Tests
```typescript
// components/__tests__/
// - DataTable renders correctly
// - Charts render with data
// - Settings persist
```

```bash
pnpm test
```

### 12.4 Manual Test Matrix
| Test Case | Windows | macOS | Linux |
|-----------|---------|-------|-------|
| Load 100k row CSV | ☐ | ☐ | ☐ |
| Load multi-sheet Excel | ☐ | ☐ | ☐ |
| Load nested JSON | ☐ | ☐ | ☐ |
| AI query → bar chart | ☐ | ☐ | ☐ |
| AI query → line chart | ☐ | ☐ | ☐ |
| AI query → pie chart | ☐ | ☐ | ☐ |
| Save/load project | ☐ | ☐ | ☐ |
| Export CSV | ☐ | ☐ | ☐ |
| Export Excel | ☐ | ☐ | ☐ |
| Export PDF | ☐ | ☐ | ☐ |

---

## Phase 13: Build & Distribution
**Duration:** 2-3 days

### 13.1 App Icons & Branding
```
src-tauri/icons/
├── 32x32.png
├── 128x128.png
├── icon.icns        # macOS
├── icon.ico         # Windows
└── icon.png         # Linux
```

### 13.2 Tauri Configuration
```json
// src-tauri/tauri.conf.json
{
  "productName": "Insyte",
  "version": "0.1.0",
  "identifier": "com.insyte.app",
  "build": {
    "beforeBuildCommand": "pnpm run build",
    "beforeDevCommand": "pnpm run dev",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "deb", "appimage"],
    "icon": ["icons/*"],
    "windows": {
      "wix": { }
    },
    "macOS": {
      "minimumSystemVersion": "10.15"
    },
    "linux": {
      "desktop": {
        "categories": ["Office", "Utility"]
      }
    }
  }
}
```

### 13.3 Build Commands
```bash
# Development
pnpm run tauri dev

# Production builds
pnpm run tauri build              # Current platform
pnpm run tauri build -- --target x86_64-pc-windows-msvc   # Windows
pnpm run tauri build -- --target x86_64-apple-darwin      # macOS Intel
pnpm run tauri build -- --target aarch64-apple-darwin     # macOS ARM
pnpm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### 13.4 CI/CD (GitHub Actions)
```yaml
# .github/workflows/release.yml
# - Build on push to main
# - Create releases for all platforms
# - Upload artifacts
```

**Test:** Build on each platform → Install → Run → All features work.

---

## Summary: Phase Timeline

| Phase | Description | Duration | Cumulative |
|-------|-------------|----------|------------|
| 0 | Project Setup | 1-2 days | 2 days |
| 1 | App Shell & Layout | 2-3 days | 5 days |
| 2 | Data Ingestion (Backend) | 3-4 days | 9 days |
| 3 | Data Preview & Table | 2-3 days | 12 days |
| 4 | AI Integration (Groq) | 3-4 days | 16 days |
| 5 | Data Processing Engine | 2-3 days | 19 days |
| 6 | Visualization Layer | 3-4 days | 23 days |
| 7 | View Toggle & Canvas | 1-2 days | 25 days |
| 8 | Project System | 2-3 days | 28 days |
| 9 | Export Functionality | 2-3 days | 31 days |
| 10 | Settings & Preferences | 1-2 days | 33 days |
| 11 | Error Handling & Polish | 2-3 days | 36 days |
| 12 | Testing & Quality | 2-3 days | 39 days |
| 13 | Build & Distribution | 2-3 days | 42 days |

**Total Estimated Time: 6-8 weeks**

---

## Milestone Checkpoints

### Milestone 1: Data Foundation (End of Phase 3)
✓ Can load CSV, Excel, JSON files  
✓ Data displays in scrollable table  
✓ Column types auto-detected  
✓ 100k rows load smoothly  

### Milestone 2: AI-Powered Viz (End of Phase 6)
✓ Natural language queries work  
✓ All 5 chart types render  
✓ Aggregations calculate correctly  
✓ Charts look professional  

### Milestone 3: Complete MVP (End of Phase 11)
✓ Projects save and load  
✓ Export to CSV, Excel, PDF  
✓ Settings persist  
✓ Polished UI/UX  
✓ Errors handled gracefully  

### Milestone 4: Release Ready (End of Phase 13)
✓ Builds for Windows, macOS, Linux  
✓ Tests passing  
✓ Documentation complete  
✓ Ready for beta users  

---

## Sample Test Data

Create these files for testing:

**sales_data.csv** (10,000 rows)
```csv
date,region,product,revenue,quantity,cost
2024-01-01,North,Widget A,1500.00,50,750.00
...
```

**inventory.xlsx** (multi-sheet)
- Sheet 1: Products
- Sheet 2: Warehouses
- Sheet 3: Stock Levels

**transactions.json**
```json
[
  {"id": 1, "customer": {"name": "Acme", "region": "West"}, "amount": 5000, "date": "2024-01-15"},
  ...
]
```

---

## Getting Started Command

```bash
# Create the project
pnpm create tauri-app@latest insyte -- --template react-ts
cd insyte

# Start Phase 0 immediately
pnpm install
pnpm run tauri dev
```

**You're ready to build Insyte! 🚀**
