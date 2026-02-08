import { useEffect, useState } from "react";
import { FilePlus, FolderOpen, Upload, Clock, FileSpreadsheet } from "lucide-react";
import { getRecentProjects, type RecentProject } from "../../services/projectService";
import { TitleBar } from "../layout";
import { cn } from "../../utils";

interface WelcomeScreenProps {
    onNewProject: () => void;
    onImportData: () => void;
    onOpenProject: () => void;
    onOpenRecent: (path: string) => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

function ActionButton({
    icon,
    label,
    description,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-start gap-3 p-3 rounded text-left transition-colors",
                "hover:bg-white/10"
            )}
        >
            <span className="text-neutral-400 mt-0.5">{icon}</span>
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{description}</div>
            </div>
        </button>
    );
}

function RecentProjectItem({
    project,
    onClick,
}: {
    project: RecentProject;
    onClick: () => void;
}) {
    const fileName = project.dataSource?.split(/[/\\]/).pop() || "No data source";

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded text-left transition-colors",
                "hover:bg-neutral-100"
            )}
        >
            <div className="w-9 h-9 rounded bg-neutral-200 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} className="text-neutral-500" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-neutral-800 truncate">
                    {project.name}
                </div>
                <div className="text-xs text-neutral-500 truncate">{fileName}</div>
            </div>
            <div className="text-xs text-neutral-400 shrink-0">
                {formatDate(project.lastOpened)}
            </div>
        </button>
    );
}

export function WelcomeScreen({
    onNewProject,
    onImportData,
    onOpenProject,
    onOpenRecent,
}: WelcomeScreenProps) {
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRecentProjects()
            .then(setRecentProjects)
            .catch(() => setRecentProjects([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="h-screen flex flex-col bg-neutral-50">
            <TitleBar />
            <div className="flex-1 flex min-h-0">
            <div className="w-72 bg-neutral-800 p-6 flex flex-col shrink-0">
                <div className="mb-8">
                    <div className="w-10 h-10 rounded mb-3">
                        <img src="/icon.png" alt="Insyte" className="w-full h-full" />
                    </div>
                    <h1 className="text-xl font-semibold text-white">insyte</h1>
                    <p className="text-xs text-neutral-400 mt-1">Data Analytics</p>
                </div>

                <div className="space-y-1">
                    <ActionButton
                        icon={<FilePlus size={18} />}
                        label="New Project"
                        description="Start with a blank canvas"
                        onClick={onNewProject}
                    />
                    <ActionButton
                        icon={<Upload size={18} />}
                        label="Import Data"
                        description="Load CSV, Excel, or JSON file"
                        onClick={onImportData}
                    />
                    <ActionButton
                        icon={<FolderOpen size={18} />}
                        label="Open Project"
                        description="Open an existing .insyte file"
                        onClick={onOpenProject}
                    />
                </div>

                <div className="flex-1" />

                <div className="text-xs text-neutral-500">
                    Version 1.0.0
                </div>
            </div>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-neutral-400" />
                        <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                            Recent Projects
                        </h2>
                    </div>

                    {loading ? (
                        <div className="text-sm text-neutral-500 py-8">Loading...</div>
                    ) : recentProjects.length === 0 ? (
                        <div className="bg-white border border-neutral-200 rounded p-8 text-center">
                            <FileSpreadsheet size={32} className="mx-auto text-neutral-300 mb-3" />
                            <p className="text-sm text-neutral-600 mb-1">No recent projects</p>
                            <p className="text-xs text-neutral-400">
                                Projects you open will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-neutral-200 rounded divide-y divide-neutral-100">
                            {recentProjects.map((project) => (
                                <RecentProjectItem
                                    key={project.path}
                                    project={project}
                                    onClick={() => onOpenRecent(project.path)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
