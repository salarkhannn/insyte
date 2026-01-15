import { invoke } from "@tauri-apps/api/core";
import type { VisualizationSpec, QueryHistoryItem, Worksheet } from "../types";

export interface ProjectData {
    sourceType: "Path" | "Embedded";
    sourcePath: string | null;
    schema: {
        columns: Array<{
            name: string;
            dtype: string;
            nullable: boolean;
        }>;
        rowCount: number;
    };
}

export interface InsyteProject {
    version: string;
    createdAt: string;
    modifiedAt: string;
    data: ProjectData;
    worksheets: Worksheet[];
    activeWorksheetId: string | null;
    queryHistory: QueryHistoryItem[];
}

export interface OpenProjectResponse {
    path: string;
    project: InsyteProject;
}

export interface RecentProject {
    path: string;
    name: string;
    lastOpened: string;
    dataSource: string | null;
}

interface BackendRecentProject {
    path: string;
    name: string;
    last_opened: string;
    data_source: string | null;
}

interface BackendOpenProjectResponse {
    path: string;
    version: string;
    created_at: string;
    modified_at: string;
    data: {
        source_type: "Path" | "Embedded";
        source_path: string | null;
        schema: {
            columns: Array<{
                name: string;
                dtype: string;
                nullable: boolean;
            }>;
            row_count: number;
        };
    };
    worksheets: Array<{
        id: string;
        name: string;
        visualization: VisualizationSpec | null;
    }>;
    active_worksheet_id: string | null;
    query_history: Array<{
        id: string;
        query: string;
        timestamp: number;
        visualization: VisualizationSpec | null;
        success: boolean;
        error?: string;
    }>;
}

function transformRecentProject(backend: BackendRecentProject): RecentProject {
    return {
        path: backend.path,
        name: backend.name,
        lastOpened: backend.last_opened,
        dataSource: backend.data_source,
    };
}

export async function saveProject(
    path: string | null,
    worksheets: Worksheet[],
    activeWorksheetId: string,
    queryHistory: QueryHistoryItem[]
): Promise<string> {
    const backendHistory = queryHistory.map((item) => ({
        id: item.id,
        query: item.query,
        timestamp: item.timestamp,
        visualization: item.visualization,
        success: item.success,
        error: item.error,
    }));

    return invoke<string>("save_project", {
        path,
        worksheets,
        activeWorksheetId,
        queryHistory: backendHistory,
    });
}

export async function saveProjectAs(
    worksheets: Worksheet[],
    activeWorksheetId: string,
    queryHistory: QueryHistoryItem[]
): Promise<string> {
    const backendHistory = queryHistory.map((item) => ({
        id: item.id,
        query: item.query,
        timestamp: item.timestamp,
        visualization: item.visualization,
        success: item.success,
        error: item.error,
    }));

    return invoke<string>("save_project_as", {
        worksheets,
        activeWorksheetId,
        queryHistory: backendHistory,
    });
}

export async function openProject(
    path?: string
): Promise<OpenProjectResponse> {
    const backend = await invoke<BackendOpenProjectResponse>("open_project", {
        path: path ?? null,
    });
    return {
        path: backend.path,
        project: {
            version: backend.version,
            createdAt: backend.created_at,
            modifiedAt: backend.modified_at,
            data: {
                sourceType: backend.data.source_type,
                sourcePath: backend.data.source_path,
                schema: {
                    columns: backend.data.schema.columns,
                    rowCount: backend.data.schema.row_count,
                },
            },
            worksheets: backend.worksheets,
            activeWorksheetId: backend.active_worksheet_id,
            queryHistory: backend.query_history.map((item) => ({
                id: item.id,
                query: item.query,
                timestamp: item.timestamp,
                visualization: item.visualization,
                success: item.success,
                error: item.error,
            })),
        },
    };
}

export async function newProject(): Promise<void> {
    return invoke("new_project");
}

export async function getRecentProjects(): Promise<RecentProject[]> {
    const backend = await invoke<BackendRecentProject[]>("get_recent_projects");
    return backend.map(transformRecentProject);
}

export async function addToRecent(path: string): Promise<void> {
    return invoke("add_to_recent", { path });
}
