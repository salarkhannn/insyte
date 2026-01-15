import { create } from "zustand";
import type { ECharts } from "echarts";

interface ChartInstanceState {
    instance: ECharts | null;
    setInstance: (instance: ECharts | null) => void;
}

export const useChartInstanceStore = create<ChartInstanceState>((set) => ({
    instance: null,
    setInstance: (instance) => set({ instance }),
}));
