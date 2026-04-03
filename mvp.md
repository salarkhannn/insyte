# **Insyte — MVP Definition**

**Insyte** is a **cross-platform desktop analytics app** that lets users **ask questions in natural language and instantly get visualizations**, with fast local data processing and no cloud lock-in.

---

## **MVP Product Goals**

* Import local datasets
* Ask questions in plain English
* Auto-generate accurate visualizations
* View and explore data in tables and charts
* Save and reopen projects
* Export results for sharing
* Run fully on **Linux, macOS, and Windows**
* UI and UX of the app should feel like existing industry standard tools like powerbi.

---

## **Core Value Proposition**

> “Load your data. Ask a question. See the chart.”

AI is not a chatbot — it is a **visualization engine**.

---

## **MVP Feature Set**

### **1. Data Ingestion (Local-First)**

Supported formats:

* CSV
* Excel (`.xlsx`)
* JSON

Implementation:

* `csv` crate
* `calamine`
* `serde_json`
* Type inference via **Polars**

Capabilities:

* Auto-detect column types
* Preview data in a table (AG Grid)
* Handle 100k+ rows smoothly

---

### **2. AI Visualization Assistant**

**MVP AI Stack (Free):**

* Local LLM via **llama.cpp / GPT4All**
* Invoked from Rust backend

Responsibilities:

* Convert natural language → **strict JSON spec**
* Choose:

  * Chart type
  * X/Y fields
  * Aggregation (sum, avg, count, etc.)

Example AI output:

```json
{
  "chart": "bar",
  "x": "month",
  "y": "revenue",
  "aggregation": "sum"
}
```

Constraints (by design):

* One chart per request
* No forecasting or advanced stats
* Deterministic schema validation

---

### **3. Visualization Layer**

**Charts**

* Recharts (React)
* Supported types:

  * Bar
  * Line
  * Area
  * Pie
  * Scatter

**Tables**

* AG Grid Community
* Filtering, sorting, aggregation enabled

Layout:

* Single-page canvas
* One active visualization at a time (MVP)

---

### **4. Data Processing Engine**

* **Polars (Rust)**

  * Lazy execution
  * Columnar operations
  * High performance on local datasets

Operations supported:

* Filter
* Group by
* Aggregate
* Sort
* Limit

Executed entirely on the backend via **Tauri commands**.

---

### **5. Project System**

**File format:** `.insyte`

Structure:

```json
{
  "version": "1.0",
  "data": {
    "source": "embedded | path",
    "schema": {...}
  },
  "transformations": [...],
  "visualization": {...},
  "layout": {...}
}
```

Properties:

* Human-readable
* Forward-compatible
* Versioned for migrations

---

### **6. Export (MVP Scope)**

Supported:

* CSV (processed data)
* Excel (`.xlsx`)
* PDF (chart snapshot)

Implementation:

* `csv` crate
* `rust_xlsxwriter`
* `printpdf` or `headless_chrome`

Deferred:

* PPTX export
* Image batches
* Power BI compatibility

---

### **7. Desktop App Architecture**

**Frontend**

* React + TypeScript
* Recharts
* AG Grid Community
* TanStack Query

**Backend**

* Tauri (Rust)
* Polars
* Tokio
* Serde
* Reqwest (for future AI APIs)

---

## **User Flow (MVP)**

1. Open **Insyte**
2. Import a dataset
3. See table preview
4. Ask a question:

   > “Show average revenue per month”
5. Insyte:

   * Parses request
   * Executes Polars query
   * Renders chart
6. Save project or export result

---

## **What Insyte MVP Does NOT Do**

* Cloud data connectors
* Multi-dashboard projects
* Collaboration or auth
* Forecasting or ML
* PPTX export
* Paid AI APIs

These are **Phase 2+** features.

---

## **Why This MVP Is Strong**

* Differentiates on **AI → visualization**, not BI bloat
* Fully **local-first**
* Zero mandatory paid services
* Fast, predictable performance
* Small surface area = shippable

---

## **Insyte MVP in One Sentence**

> **Insyte is a local, AI-powered data visualization desktop app that turns questions into charts.**

---