import { useState, useEffect, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { X, Eye, EyeOff, Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "../../utils";
import {
    getSettings,
    updateSettings,
    validateApiKey,
    type AppSettings,
} from "../../services/settingsService";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AVAILABLE_MODELS = [
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [originalSettings, setOriginalSettings] = useState<AppSettings | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hasChanges = useMemo(() => {
        if (!settings || !originalSettings) return false;
        return (
            settings.groq_api_key !== originalSettings.groq_api_key ||
            settings.groq_model !== originalSettings.groq_model ||
            settings.auto_save !== originalSettings.auto_save ||
            settings.theme !== originalSettings.theme ||
            settings.max_preview_rows !== originalSettings.max_preview_rows
        );
    }, [settings, originalSettings]);

    useEffect(() => {
        if (open) {
            loadSettings();
        } else {
            setOriginalSettings(null);
            setSettings(null);
            setValidationResult(null);
            setError(null);
        }
    }, [open]);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const s = await getSettings();
            setOriginalSettings(s);
            setSettings({ ...s });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings || !hasChanges) return;
        setSaving(true);
        setError(null);
        try {
            await updateSettings(settings);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    };

    const handleValidateApiKey = async () => {
        if (!settings?.groq_api_key) return;
        setValidating(true);
        setValidationResult(null);
        try {
            const valid = await validateApiKey(settings.groq_api_key);
            setValidationResult(valid);
        } catch {
            setValidationResult(false);
        } finally {
            setValidating(false);
        }
    };

    const updateField = <K extends keyof AppSettings>(
        field: K,
        value: AppSettings[K]
    ) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
        if (field === "groq_api_key") {
            setValidationResult(null);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-h-[85vh] bg-white border border-neutral-200 shadow-xl focus:outline-none flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 shrink-0">
                        <Dialog.Title className="text-base font-semibold text-neutral-900">
                            Settings
                        </Dialog.Title>
                        <Dialog.Close className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded">
                            <X size={18} />
                        </Dialog.Close>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="animate-spin text-neutral-400" />
                        </div>
                    ) : settings ? (
                        <Tabs.Root defaultValue="general" className="flex flex-col flex-1 overflow-hidden min-h-0">
                            <Tabs.List className="flex border-b border-neutral-200 bg-neutral-50 px-5 shrink-0">
                                <Tabs.Trigger
                                    value="general"
                                    className={cn(
                                        "px-4 py-2.5 text-sm font-medium text-neutral-600",
                                        "border-b-2 border-transparent -mb-px",
                                        "data-[state=active]:text-neutral-900 data-[state=active]:border-primary"
                                    )}
                                >
                                    General
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="ai"
                                    className={cn(
                                        "px-4 py-2.5 text-sm font-medium text-neutral-600",
                                        "border-b-2 border-transparent -mb-px",
                                        "data-[state=active]:text-neutral-900 data-[state=active]:border-primary"
                                    )}
                                >
                                    AI Configuration
                                </Tabs.Trigger>
                                <Tabs.Trigger
                                    value="about"
                                    className={cn(
                                        "px-4 py-2.5 text-sm font-medium text-neutral-600",
                                        "border-b-2 border-transparent -mb-px",
                                        "data-[state=active]:text-neutral-900 data-[state=active]:border-primary"
                                    )}
                                >
                                    About
                                </Tabs.Trigger>
                            </Tabs.List>

                            <Tabs.Content value="general" className="p-5 space-y-5 overflow-auto">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        Max Preview Rows
                                    </label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={10000}
                                        value={settings.max_preview_rows}
                                        onChange={(e) =>
                                            updateField("max_preview_rows", parseInt(e.target.value) || 100)
                                        }
                                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <p className="text-xs text-neutral-500">
                                        Maximum number of rows to display in the data preview.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <div className="text-sm font-medium text-neutral-700">
                                            Auto-save Projects
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            Automatically save project changes.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => updateField("auto_save", !settings.auto_save)}
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors",
                                            settings.auto_save ? "bg-primary" : "bg-neutral-300"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                settings.auto_save ? "translate-x-5" : "translate-x-0.5"
                                            )}
                                        />
                                    </button>
                                </div>
                            </Tabs.Content>

                            <Tabs.Content value="ai" className="p-5 space-y-5 overflow-auto">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        Groq API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={settings.groq_api_key ?? ""}
                                            onChange={(e) =>
                                                updateField("groq_api_key", e.target.value || null)
                                            }
                                            placeholder="gsk_..."
                                            autoComplete="off"
                                            className="w-full px-3 py-2 pr-20 text-sm font-mono border border-neutral-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                                        />
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="p-1.5 text-neutral-400 hover:text-neutral-600"
                                            >
                                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={handleValidateApiKey}
                                                disabled={!settings.groq_api_key || validating}
                                                className={cn(
                                                    "px-2 py-1 text-xs font-medium rounded",
                                                    "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                                )}
                                            >
                                                {validating ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    "Test"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {validationResult !== null && (
                                        <div
                                            className={cn(
                                                "flex items-center gap-1.5 text-xs",
                                                validationResult ? "text-green-600" : "text-red-600"
                                            )}
                                        >
                                            {validationResult ? (
                                                <>
                                                    <Check size={12} />
                                                    API key is valid
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={12} />
                                                    API key is invalid
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-neutral-500">
                                        Get your API key from{" "}
                                        <a
                                            href="https://console.groq.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            console.groq.com
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        AI Model
                                    </label>
                                    <select
                                        value={settings.groq_model}
                                        onChange={(e) => updateField("groq_model", e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                                    >
                                        {AVAILABLE_MODELS.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-neutral-500">
                                        Select the LLM model for AI-powered analysis.
                                    </p>
                                </div>
                            </Tabs.Content>

                            <Tabs.Content value="about" className="p-5 overflow-auto">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                            I
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold text-neutral-900">
                                                Insyte
                                            </div>
                                            <div className="text-sm text-neutral-500">Version 0.1.0</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-600">
                                        AI-powered data analytics and visualization tool. 
                                        Built with Tauri, React, and Polars.
                                    </p>
                                    <div className="pt-3 border-t border-neutral-200">
                                        <div className="text-xs text-neutral-400">
                                            © 2024 Insyte. All rights reserved.
                                        </div>
                                    </div>
                                </div>
                            </Tabs.Content>
                        </Tabs.Root>
                    ) : null}

                    {error && (
                        <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-200 bg-neutral-50 shrink-0">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!settings || saving || !hasChanges}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            style={{
                                backgroundColor: hasChanges ? '#2563EB' : '#93b3eb',
                                color: 'white'
                            }}
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
