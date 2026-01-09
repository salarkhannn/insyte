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
  const info = await invoke<BackendDatasetInfo>("load_excel", {
    path,
    sheet,
  });
  return transformDatasetInfo(info);
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