import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export interface StepperProps extends ComponentProps<"ol"> {
  steps: StepperStep[];
  currentStep: number;
  /** Callback opcional ao clicar em um passo já concluído (para navegação para trás). */
  onStepClick?: (index: number) => void;
  orientation?: "horizontal" | "vertical";
}

/**
 * Stepper acessível para fluxos multi-etapas (criar campanha, sequência, etc.).
 * - Semântica: `<ol>` com `aria-current="step"` no passo ativo.
 * - Suporta clique só em passos passados (não pula à frente).
 * - Respeita reduced-motion (sem animações agressivas).
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  className,
  ...rest
}: StepperProps) {
  const total = steps.length;
  const clampedCurrent = Math.max(0, Math.min(currentStep, total - 1));

  return (
    <ol
      aria-label="Progresso do fluxo"
      className={cn(
        "flex w-full",
        orientation === "horizontal"
          ? "flex-row items-start gap-2 overflow-x-auto"
          : "flex-col gap-4",
        className,
      )}
      {...rest}
    >
      {steps.map((step, index) => {
        const isCompleted = index < clampedCurrent;
        const isCurrent = index === clampedCurrent;
        const isClickable = onStepClick && isCompleted;

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-start gap-3",
              orientation === "horizontal" && "flex-1",
            )}
          >
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(index)}
              aria-label={`${isCompleted ? "Concluído: " : isCurrent ? "Atual: " : "Pendente: "}${step.label}`}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-background text-primary",
                !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground",
                isClickable && "cursor-pointer hover:brightness-110",
                !isClickable && "cursor-default",
              )}
            >
              {isCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
                {step.optional && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (opcional)
                  </span>
                )}
              </p>
              {step.description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {step.description}
                </p>
              )}
            </div>
            {orientation === "horizontal" && index < total - 1 && (
              <div
                aria-hidden="true"
                className={cn(
                  "mt-4 h-0.5 flex-1 rounded-full",
                  isCompleted ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StepperContent({ children, className, ...rest }: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn("mt-6", className)} {...rest}>
      {children}
    </div>
  );
}

export default Stepper;
