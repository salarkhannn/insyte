import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridReadyEvent, SortChangedEvent, FilterChangedEvent, CellClickedEvent } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import type { Column } from "../../types";

ModuleRegistry.registerModules([AllCommunityModule]);

const gridTheme = themeQuartz.withParams({
    accentColor: "#2563EB",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E5E5",
    borderRadius: 2,
    browserColorScheme: "light",
    cellHorizontalPaddingScale: 0.8,
    columnBorder: true,
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    fontSize: 13,
    foregroundColor: "#171717",
    headerBackgroundColor: "#F5F5F5",
    headerFontSize: 12,
    headerFontWeight: 500,
    headerTextColor: "#525252",
    oddRowBackgroundColor: "#FAFAFA",
    rowBorder: true,
    rowVerticalPaddingScale: 0.8,
    spacing: 5,
    wrapperBorderRadius: 2,
});

interface DataTableProps {
    columns: Column[];
    rowData: Record<string, unknown>[];
    onColumnSelect?: (columnName: string) => void;
    onSortChange?: (columnName: string, direction: "asc" | "desc" | null) => void;
    onFilterChange?: (filters: Record<string, unknown>) => void;
}

function mapColumnType(dtype: Column["dtype"]): string {
    switch (dtype) {
        case "integer":
        case "float":
            return "numericColumn";
        case "date":
            return "dateColumn";
        default:
            return "textColumn";
    }
}

function createColumnDefs(columns: Column[]): ColDef[] {
    return columns.map((col) => ({
        field: col.name,
        headerName: col.name,
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 80,
        flex: 1,
        type: mapColumnType(col.dtype),
        cellDataType: col.dtype === "integer" || col.dtype === "float" ? "number" : col.dtype === "date" ? "date" : "text",
    }));
}

export function DataTable({
    columns,
    rowData,
    onColumnSelect,
    onSortChange,
    onFilterChange,
}: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);

    const columnDefs = useMemo(() => createColumnDefs(columns), [columns]);

    const defaultColDef = useMemo<ColDef>(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            minWidth: 80,
        }),
        []
    );

    const onGridReady = useCallback((event: GridReadyEvent) => {
        event.api.sizeColumnsToFit();
    }, []);

    const handleSortChanged = useCallback(
        (event: SortChangedEvent) => {
            if (!onSortChange) return;
            const sortModel = event.api.getColumnState().find((col) => col.sort);
            if (sortModel) {
                onSortChange(sortModel.colId, sortModel.sort as "asc" | "desc");
            } else {
                onSortChange("", null);
            }
        },
        [onSortChange]
    );

    const handleFilterChanged = useCallback(
        (event: FilterChangedEvent) => {
            if (!onFilterChange) return;
            const filterModel = event.api.getFilterModel();
            onFilterChange(filterModel);
        },
        [onFilterChange]
    );

    const handleCellClicked = useCallback(
        (event: CellClickedEvent) => {
            if (!onColumnSelect || !event.colDef.field) return;
            onColumnSelect(event.colDef.field);
        },
        [onColumnSelect]
    );

    return (
        <div className="w-full h-full">
            <AgGridReact
                ref={gridRef}
                theme={gridTheme}
                columnDefs={columnDefs}
                rowData={rowData}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                animateRows={false}
                onGridReady={onGridReady}
                onSortChanged={handleSortChanged}
                onFilterChanged={handleFilterChanged}
                onCellClicked={handleCellClicked}
            />
        </div>
    );
}