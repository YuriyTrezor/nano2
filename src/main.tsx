import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isPreviewEnvironment =
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("id-preview--");

// Register Service Worker
if ('serviceWorker' in navigator && !isPreviewEnvironment) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed silently
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
