import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any previously installed service worker and clear its caches.
// The SW was caching index.html / JS, which caused stale builds and broken
// logins for many users. We disable it until a safer strategy is in place.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister().catch(() => {}));
  }).catch(() => {});

  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key).catch(() => {}));
    }).catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
