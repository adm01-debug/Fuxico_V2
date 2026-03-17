import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
// Force full reload v4

// Accessibility: Add skip link target
const root = document.getElementById("root")!;

// Create skip link for keyboard navigation
const skipLink = document.createElement("a");
skipLink.href = "#main-content";
skipLink.className = "skip-to-content";
skipLink.textContent = "Pular para o conteúdo principal";
document.body.insertBefore(skipLink, document.body.firstChild);

createRoot(root).render(<App />);
