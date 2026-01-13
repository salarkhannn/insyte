use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu},
    App, AppHandle, Emitter, Wry,
};

pub const MENU_NEW_PROJECT: &str = "new_project";
pub const MENU_OPEN_PROJECT: &str = "open_project";
pub const MENU_SAVE: &str = "save";
pub const MENU_SAVE_AS: &str = "save_as";
pub const MENU_IMPORT_DATA: &str = "import_data";
pub const MENU_EXPORT_DATA: &str = "export_data";
pub const MENU_CLOSE_PROJECT: &str = "close_project";

pub const MENU_VIEW_TABLE: &str = "view_table";
pub const MENU_VIEW_CHART: &str = "view_chart";
pub const MENU_TOGGLE_SIDEBAR: &str = "toggle_sidebar";
pub const MENU_TOGGLE_AI_PANEL: &str = "toggle_ai_panel";

pub fn create_menu(app: &App) -> Result<Menu<Wry>, tauri::Error> {
    let handle = app.handle();

    let file_menu = create_file_menu(handle)?;
    let edit_menu = create_edit_menu(handle)?;
    let view_menu = create_view_menu(handle)?;
    let help_menu = create_help_menu(handle)?;

    Menu::with_items(handle, &[&file_menu, &edit_menu, &view_menu, &help_menu])
}

fn create_file_menu(handle: &AppHandle) -> Result<Submenu<Wry>, tauri::Error> {
    let new_project = MenuItem::with_id(
        handle,
        MENU_NEW_PROJECT,
        "New Project",
        true,
        Some("CmdOrCtrl+N"),
    )?;

    let open_project = MenuItem::with_id(
        handle,
        MENU_OPEN_PROJECT,
        "Open Project...",
        true,
        Some("CmdOrCtrl+O"),
    )?;

    let save = MenuItem::with_id(handle, MENU_SAVE, "Save", true, Some("CmdOrCtrl+S"))?;

    let save_as = MenuItem::with_id(
        handle,
        MENU_SAVE_AS,
        "Save As...",
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;

    let separator1 = PredefinedMenuItem::separator(handle)?;

    let import_data =
        MenuItem::with_id(handle, MENU_IMPORT_DATA, "Import Data...", true, None::<&str>)?;

    let export_data =
        MenuItem::with_id(handle, MENU_EXPORT_DATA, "Export Data...", true, None::<&str>)?;

    let separator2 = PredefinedMenuItem::separator(handle)?;

    let close_project = MenuItem::with_id(
        handle,
        MENU_CLOSE_PROJECT,
        "Close Project",
        true,
        Some("CmdOrCtrl+W"),
    )?;

    let separator3 = PredefinedMenuItem::separator(handle)?;

    let quit = PredefinedMenuItem::quit(handle, Some("Quit"))?;

    Submenu::with_items(
        handle,
        "File",
        true,
        &[
            &new_project,
            &open_project,
            &separator1,
            &save,
            &save_as,
            &separator2,
            &import_data,
            &export_data,
            &separator3,
            &close_project,
            &PredefinedMenuItem::separator(handle)?,
            &quit,
        ],
    )
}

fn create_edit_menu(handle: &AppHandle) -> Result<Submenu<Wry>, tauri::Error> {
    let undo = PredefinedMenuItem::undo(handle, Some("Undo"))?;
    let redo = PredefinedMenuItem::redo(handle, Some("Redo"))?;
    let separator = PredefinedMenuItem::separator(handle)?;
    let cut = PredefinedMenuItem::cut(handle, Some("Cut"))?;
    let copy = PredefinedMenuItem::copy(handle, Some("Copy"))?;
    let paste = PredefinedMenuItem::paste(handle, Some("Paste"))?;
    let select_all = PredefinedMenuItem::select_all(handle, Some("Select All"))?;

    Submenu::with_items(
        handle,
        "Edit",
        true,
        &[
            &undo,
            &redo,
            &separator,
            &cut,
            &copy,
            &paste,
            &PredefinedMenuItem::separator(handle)?,
            &select_all,
        ],
    )
}

fn create_view_menu(handle: &AppHandle) -> Result<Submenu<Wry>, tauri::Error> {
    let view_table = MenuItem::with_id(
        handle,
        MENU_VIEW_TABLE,
        "Table View",
        true,
        Some("CmdOrCtrl+1"),
    )?;

    let view_chart = MenuItem::with_id(
        handle,
        MENU_VIEW_CHART,
        "Chart View",
        true,
        Some("CmdOrCtrl+2"),
    )?;

    let separator1 = PredefinedMenuItem::separator(handle)?;

    let toggle_sidebar = MenuItem::with_id(
        handle,
        MENU_TOGGLE_SIDEBAR,
        "Toggle Sidebar",
        true,
        Some("CmdOrCtrl+B"),
    )?;

    let toggle_ai_panel = MenuItem::with_id(
        handle,
        MENU_TOGGLE_AI_PANEL,
        "Toggle AI Assistant",
        true,
        Some("CmdOrCtrl+Shift+A"),
    )?;

    let separator2 = PredefinedMenuItem::separator(handle)?;

    let fullscreen = PredefinedMenuItem::fullscreen(handle, Some("Toggle Fullscreen"))?;

    Submenu::with_items(
        handle,
        "View",
        true,
        &[
            &view_table,
            &view_chart,
            &separator1,
            &toggle_sidebar,
            &toggle_ai_panel,
            &separator2,
            &fullscreen,
        ],
    )
}

fn create_help_menu(handle: &AppHandle) -> Result<Submenu<Wry>, tauri::Error> {
    let about = PredefinedMenuItem::about(handle, Some("About Insyte"), None)?;

    Submenu::with_items(handle, "Help", true, &[&about])
}

pub fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    let menu_id = event.id();
    let id_str = menu_id.as_ref();

    match id_str {
        MENU_NEW_PROJECT
        | MENU_OPEN_PROJECT
        | MENU_SAVE
        | MENU_SAVE_AS
        | MENU_IMPORT_DATA
        | MENU_EXPORT_DATA
        | MENU_CLOSE_PROJECT
        | MENU_VIEW_TABLE
        | MENU_VIEW_CHART
        | MENU_TOGGLE_SIDEBAR
        | MENU_TOGGLE_AI_PANEL => {
            let _ = app.emit("menu-event", id_str);
        }
        _ => {}
    }
}
