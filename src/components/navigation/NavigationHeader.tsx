import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export interface NavigationHeaderProps extends ComponentProps<"header"> {
  title?: string;
  description?: string;
  /** Rota de fallback quando não há histórico. Default: `/dashboard`. */
  fallbackPath?: string;
  /** Ação customizada ao clicar em voltar (retornar `false` cancela a navegação). */
  onBack?: () => boolean | void;
  actions?: ReactNode;
  hideBackButton?: boolean;
}

/**
 * Cabeçalho global de navegação com botão "Voltar" contextual.
 * Usa o histórico do navegador; se não houver, cai para `fallbackPath`.
 */
export function NavigationHeader({
  title,
  description,
  fallbackPath = "/dashboard",
  onBack,
  actions,
  hideBackButton,
  className,
  children,
  ...rest
}: NavigationHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack && onBack() === false) return;
    // window.history.length > 1 significa que há um passo anterior real
    if (window.history.length > 1 && location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <header
      className={cn(
        "flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-3 sm:items-center">
        {!hideBackButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Voltar para a página anterior"
            onClick={handleBack}
            className="h-9 w-9 shrink-0 transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {(title || description) && (
          <div className="flex flex-col">
            {title && <h1 className="text-lg font-semibold leading-tight sm:text-xl">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export default NavigationHeader;
