import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface UnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Dialog acessível para acompanhar o hook `useUnsavedChanges`.
 * Use-o passando `onConfirm={confirmNavigation}` e `onCancel={cancelNavigation}`.
 */
export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  title = "Alterações não salvas",
  description = "Você tem mudanças que ainda não foram salvas. Se sair agora, elas serão perdidas.",
  confirmLabel = "Sair sem salvar",
  cancelLabel = "Continuar editando",
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default UnsavedChangesDialog;
