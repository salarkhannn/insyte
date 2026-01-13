import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { menuService } from "./services/menuService";

// Initialize the menu service before React renders
// This ensures only one Tauri event listener is created
menuService.init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
