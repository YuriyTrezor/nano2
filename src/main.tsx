import { createRoot } from "react-dom/client";
// Must be imported BEFORE App so the fetch monkey-patch is in place
// before the Supabase client makes any request. This unblocks users in
// regions (RU, etc.) where *.supabase.co is blocked by the ISP.
import "./lib/supabaseFetchProxy";
import App from "./App.tsx";
import "./index.css";

// Belt-and-suspenders: kill any service worker / cache that may still be
// alive after the inline cleanup in index.html ran. This protects users in
// regions (RU, etc.) where ISPs / browsers cache aggressively.
(async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
  } catch {}
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch {}
  // Best-effort: clear any leftover Supabase auth artifacts in legacy keys
  // that could conflict with the current session storage.
  try {
    const legacyKeys = ['supabase.auth.token'];
    legacyKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch {}
})();

createRoot(document.getElementById("root")!).render(<App />);
