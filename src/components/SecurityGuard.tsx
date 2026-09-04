import { useEffect } from "react";

/**
 * Client-side deterrents: disables right-click, text selection/copy,
 * common devtools shortcuts, and image dragging.
 *
 * NOTE: This is only a deterrent. A determined user can still view source
 * or open devtools via the browser menu. True security must live on the server.
 */
export function SecurityGuard() {
  useEffect(() => {
    const prevent = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I / J / C / K  (devtools, console, inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "k"].includes(k)) {
        e.preventDefault();
        return;
      }
      // Ctrl+U (view source), Ctrl+S (save), Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && ["u", "s", "p"].includes(k)) {
        e.preventDefault();
        return;
      }
      // Block copy / cut / paste shortcuts
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a"].includes(k)) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        // Allow inside form fields so checkout/search still works
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !target?.isContentEditable) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("selectstart", (e) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && !t?.isContentEditable) {
        e.preventDefault();
      }
    });
    document.addEventListener("keydown", onKeyDown);

    // Inject CSS to disable text selection app-wide (form fields opt back in)
    const style = document.createElement("style");
    style.setAttribute("data-security-guard", "");
    style.textContent = `
      html, body { -webkit-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }
      img { -webkit-user-drag: none; user-drag: none; pointer-events: auto; }
    `;
    document.head.appendChild(style);

    // --- Devtools detection (production only) ---
    // Skip inside Lovable preview/editor iframes and on localhost to avoid
    // false positives — the editor chrome makes outerWidth - innerWidth look
    // like devtools is open.
    const host = window.location.hostname;
    const inIframe = window.self !== window.top;
    const isPreview =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".lovableproject.com") ||
      host.endsWith(".lovable.app") ||
      inIframe;

    let interval: number | undefined;
    // Devtools detection / block screen intentionally removed per request.




    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("keydown", onKeyDown);
      if (interval !== undefined) window.clearInterval(interval);
      style.remove();
    };
  }, []);

  return null;
}
