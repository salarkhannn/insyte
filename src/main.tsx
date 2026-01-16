import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";
import { menuService } from "./services/menuService";

// Initialize the menu service before React renders
// This ensures only one Tauri event listener is created
menuService.init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#262626',
          color: '#FAFAFA',
          fontSize: '13px',
          borderRadius: '4px',
          padding: '10px 14px',
        },
        success: {
          iconTheme: {
            primary: '#16A34A',
            secondary: '#FAFAFA',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#FAFAFA',
          },
          duration: 5000,
        },
      }}
    />
  </React.StrictMode>,
);
