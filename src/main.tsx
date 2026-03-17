import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
// Force full reload v6

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys
        .filter((key) => key.startsWith("fuxico-"))
        .forEach((key) => {
          caches.delete(key);
        });
    });
  }
}

const root = document.getElementById("root")!;

// Create skip link for keyboard navigation (accessibility)
const existingSkip = document.querySelector('.skip-to-content');
if (!existingSkip) {
  const skipLink = document.createElement("a");
  skipLink.href = "#main-content";
  skipLink.className = "skip-to-content";
  skipLink.textContent = "Pular para o conteúdo principal";
  document.body.insertBefore(skipLink, document.body.firstChild);
}

createRoot(root).render(<App />);
