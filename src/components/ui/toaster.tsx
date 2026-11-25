import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const variantIcons = {
  default: <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />,
  destructive: <AlertCircle className="h-5 w-5 shrink-0" />,
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant === 'destructive' ? variantIcons.destructive : variantIcons.default;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{icon}</div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
