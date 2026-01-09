import { useAppStore } from "../../stores/appStore";
import { useDataStore } from "../../stores/dataStore";
import { DataTable } from "./DataTable";

export function TableView() {
    const { columns } = useAppStore();
    const { rowData, setSort, setFilters } = useDataStore();

    const handleSortChange = (column: string, direction: "asc" | "desc" | null) => {
        setSort(column || null, direction);
    };

    const handleFilterChange = (filters: Record<string, unknown>) => {
        setFilters(filters);
    };

    if (columns.length === 0) {
        return null;
    }

    return (
        <div className="h-full w-full">
            <DataTable
                columns={columns}
                rowData={rowData}
                onSortChange={handleSortChange}
                onFilterChange={handleFilterChange}
            />
        </div>
    );
}