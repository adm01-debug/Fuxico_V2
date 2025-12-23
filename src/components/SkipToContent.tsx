import { useState } from "react";
import { cn } from "@/lib/utils";

export function SkipToContent() {
  const [focused, setFocused] = useState(false);

  return (
    <a
      href="#main-content"
      className={cn(
        "fixed top-0 left-0 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded-br-lg",
        "transform -translate-y-full transition-transform duration-200",
        "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring",
        focused && "translate-y-0"
      )}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      Pular para o conteúdo principal
    </a>
  );
}

export default SkipToContent;

