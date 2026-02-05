import { invoke } from "@tauri-apps/api/core";
import { useChartInstanceStore } from "../stores/chartInstanceStore";

export async function exportCsv(path?: string): Promise<string> {
    return invoke<string>("export_csv", { path: path ?? null });
}

export async function exportExcel(path?: string): Promise<string> {
    return invoke<string>("export_excel", { path: path ?? null });
}

interface ChartExportMetadata {
    title: string;
    record_count: number;
    x_label: string | null;
    y_label: string | null;
}

export async function exportChart(
    title: string,
    recordCount: number,
    xLabel?: string,
    yLabel?: string
): Promise<string> {
    const instance = useChartInstanceStore.getState().instance;
    if (!instance) {
        throw new Error("No chart available to export");
    }

    const dataUrl = instance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
    });

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

    const metadata: ChartExportMetadata = {
        title,
        record_count: recordCount,
        x_label: xLabel ?? null,
        y_label: yLabel ?? null,
    };

    return invoke<string>("export_chart", { imageData: base64Data, metadata });
}
