import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Column } from "../types";

interface BackendDatasetInfo {
  file_name: string;
  file_path: string;
  file_size: number;
  row_count: number;
  columns: Array<{
    name: string;
    dtype: string;
    nullable: boolean;
  }>;
  tables?: string[];
}

interface BackendDataPage {
  rows: unknown[][];
  total_rows: number;
  offset: number;
  limit: number;
}

export interface DatasetInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  rowCount: number;
  columns: Column[];
  tables: string[];
}

export interface DataPage {
  rows: Record<string, unknown>[];
  totalRows: number;
  offset: number;
  limit: number;
}

function mapDtype(dtype: string): Column["dtype"] {
  switch (dtype) {
    case "integer":
      return "integer";
    case "float":
      return "float";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    default:
      return "string";
  }
}

function transformDatasetInfo(info: BackendDatasetInfo): DatasetInfo {
  return {
    fileName: info.file_name,
    filePath: info.file_path,
    fileSize: info.file_size,
    rowCount: info.row_count,
    columns: info.columns.map((col) => ({
      name: col.name,
      dtype: mapDtype(col.dtype),
      nullable: col.nullable,
    })),
    tables: info.tables || [],
  };
}

function transformDataPage(
  page: BackendDataPage,
  columns: Column[]
): DataPage {
  const columnNames = columns.map((c) => c.name);

  const rows = page.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((val, idx) => {
      if (idx < columnNames.length) {
        obj[columnNames[idx]] = val;
      }
    });
    return obj;
  });

  return {
    rows,
    totalRows: page.total_rows,
    offset: page.offset,
    limit: page.limit,
  };
}

export async function openFileDialog(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Data Files",
        extensions: ["csv", "xlsx", "xls", "json"],
      },
      {
        name: "CSV",
        extensions: ["csv"],
      },
      {
        name: "Excel",
        extensions: ["xlsx", "xls"],
      },
      {
        name: "JSON",
        extensions: ["json"],
      },
    ],
  });

  if (typeof selected === "string") {
    return selected;
  }

  return null;
}

export async function loadFile(path: string): Promise<DatasetInfo> {
  const ext = path.split(".").pop()?.toLowerCase();

  let info: BackendDatasetInfo;

  switch (ext) {
    case "csv":
      info = await invoke<BackendDatasetInfo>("load_csv", { path });
      break;
    case "xlsx":
    case "xls":
      // Load all sheets by default
      info = await invoke<BackendDatasetInfo>("load_excel", { path, sheet: null });
      break;
    case "json":
      info = await invoke<BackendDatasetInfo>("load_json", { path });
      break;
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }

  return transformDatasetInfo(info);
}

export async function listExcelSheets(path: string): Promise<string[]> {
  return invoke<string[]>("list_excel_sheets", { path });
}

export async function loadExcelSheet(
  path: string,
  sheet: string
): Promise<DatasetInfo> {
  // This might be used to force reload a specific sheet, but our new backend loads all.
  // We can just use setActiveTable if it's already loaded, or re-load.
  // For now, let's just re-use load_excel, it ignores 'sheet' param if we removed it, 
  // OR we should keep the 'sheet' param in backend but make it optional? 
  // I updated backend to accept `sheet: Option<String>` but then I rewrote the logic to IGNORE it and load all sheets if `sheets` found.
  // Wait, I rewrote `load_excel` to `if let Some((first_sheet_name...))`. I didn't check the `sheet` param to set active table.
  // That's fine, we can set active table after loading.
  
  const info = await invoke<BackendDatasetInfo>("load_excel", {
    path,
    sheet: null,
  });
  
  // If a specific sheet was requested, we should set it as active.
  if (sheet && info.tables?.includes(sheet)) {
      return await setActiveTable(sheet);
  }

  return transformDatasetInfo(info);
}

export async function setActiveTable(tableName: string): Promise<DatasetInfo> {
    console.log('[fileService] setActiveTable called with tableName:', tableName);
    console.log('[fileService] Invoking Tauri command: set_active_table');
    const info = await invoke<BackendDatasetInfo>("set_active_table", { tableName });
    console.log('[fileService] Backend returned:', info);
    const transformed = transformDatasetInfo(info);
    console.log('[fileService] Transformed result:', transformed);
    return transformed;
}

export async function getDataPage(
  offset: number,
  limit: number,
  columns: Column[]
): Promise<DataPage> {
  const page = await invoke<BackendDataPage>("get_data_page", {
    offset,
    limit,
  });
  return transformDataPage(page, columns);
}

export async function clearData(): Promise<void> {
  await invoke("clear_data");
}