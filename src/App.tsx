import { open } from "@tauri-apps/plugin-dialog";
import { AppShell } from "./components/layout";
import { WelcomeScreen } from "./components/welcome";
import { SettingsDialog } from "./components/settings";
import { useAppStore } from "./stores/appStore";
import { useDataStore } from "./stores/dataStore";
import { useVizBuilderStore } from "./stores/vizBuilderStore";
import { loadFile, getDataPage } from "./services/fileService";
import { openProject } from "./services/projectService";

function App() {
    const {
        showWelcome,
        settingsOpen,
        setShowWelcome,
        setSettingsOpen,
        setDataset,
        setQueryHistory,
        setProjectPath,
        setProcessing,
        setError,
        setWorksheets,
    } = useAppStore();
    const { setRowData } = useDataStore();
    const resetVizBuilder = useVizBuilderStore((state) => state.reset);

    const handleNewProject = () => {
        setShowWelcome(false);
    };

    const handleImportData = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [
                    { name: "Data Files", extensions: ["csv", "xlsx", "xls", "json"] },
                ],
            });

            if (selected && typeof selected === "string") {
                setProcessing(true, "Loading data...");
                
                resetVizBuilder();
                
                const info = await loadFile(selected);

                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                    tables: info.tables,
                });

                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenProject = async () => {
        try {
            setProcessing(true, "Opening project...");
            const { path, project } = await openProject();

            if (project.data.sourcePath) {
                const info = await loadFile(project.data.sourcePath);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                    tables: info.tables,
                });

                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }

            if (project.worksheets && project.worksheets.length > 0 && project.activeWorksheetId) {
                setWorksheets(project.worksheets, project.activeWorksheetId);
            }

            setQueryHistory(project.queryHistory);
            setProjectPath(path);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (!message.includes("cancelled")) {
                setError(message);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenRecent = async (path: string) => {
        try {
            setProcessing(true, "Opening project...");
            const { project } = await openProject(path);

            if (project.data.sourcePath) {
                const info = await loadFile(project.data.sourcePath);
                setDataset({
                    fileName: info.fileName,
                    filePath: info.filePath,
                    columns: info.columns,
                    rowCount: info.rowCount,
                    fileSize: info.fileSize,
                    tables: info.tables,
                });

                const page = await getDataPage(0, 10000, info.columns);
                setRowData(page.rows, page.totalRows);
            }

            if (project.worksheets && project.worksheets.length > 0 && project.activeWorksheetId) {
                setWorksheets(project.worksheets, project.activeWorksheetId);
            }

            setQueryHistory(project.queryHistory);
            setProjectPath(path);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(false);
        }
    };

    if (showWelcome) {
        return (
            <>
                <WelcomeScreen
                    onNewProject={handleNewProject}
                    onImportData={handleImportData}
                    onOpenProject={handleOpenProject}
                    onOpenRecent={handleOpenRecent}
                />
                <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            </>
        );
    }

    return (
        <>
            <AppShell />
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}

export default App;