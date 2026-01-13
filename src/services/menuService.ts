/**
 * Menu Service - Handles Tauri menu events at the application level.
 * 
 * This service initializes once when imported and sets up a single
 * event listener for menu events. It uses a pub/sub pattern to
 * notify React components of menu actions.
 */

import { listen, UnlistenFn } from "@tauri-apps/api/event";

export type MenuEventId =
    | "new_project"
    | "open_project"
    | "save"
    | "save_as"
    | "import_data"
    | "export_data"
    | "close_project"
    | "view_table"
    | "view_chart"
    | "toggle_sidebar"
    | "toggle_ai_panel";

type MenuEventCallback = (eventId: MenuEventId) => void;

class MenuService {
    private listeners: Set<MenuEventCallback> = new Set();
    private unlistenFn: UnlistenFn | null = null;
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;

        this.unlistenFn = await listen<MenuEventId>("menu-event", (event) => {
            const menuId = event.payload;
            this.listeners.forEach((callback) => {
                try {
                    callback(menuId);
                } catch (err) {
                    console.error("Error in menu event handler:", err);
                }
            });
        });
    }

    subscribe(callback: MenuEventCallback): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    destroy(): void {
        if (this.unlistenFn) {
            this.unlistenFn();
            this.unlistenFn = null;
        }
        this.listeners.clear();
        this.initialized = false;
    }
}

// Singleton instance
export const menuService = new MenuService();
