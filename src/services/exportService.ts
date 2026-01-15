import { invoke } from "@tauri-apps/api/core";
import { useChartInstanceStore } from "../stores/chartInstanceStore";

export async function exportCsv(path?: string): Promise<string> {
    return invoke<string>("export_csv", { path: path ?? null });
}

export async function exportExcel(path?: string): Promise<string> {
    return invoke<string>("export_excel", { path: path ?? null });
}

export async function exportChartAsPng(): Promise<string> {
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

    return invoke<string>("export_chart_image", { imageData: base64Data });
}

