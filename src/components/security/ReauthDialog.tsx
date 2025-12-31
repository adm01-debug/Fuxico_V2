import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, Shield } from 'lucide-react';
import { useReauthentication, ReauthAction } from '@/hooks/useReauthentication';

interface ReauthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ReauthAction;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

const ACTION_DESCRIPTIONS: Record<ReauthAction, string> = {
  change_password: 'alterar sua senha',
  change_email: 'alterar seu email',
  configure_mfa: 'configurar autenticação de dois fatores',
  admin_action: 'executar esta ação administrativa',
  delete_account: 'excluir sua conta',
  sensitive_data: 'acessar dados sensíveis',
};

export function ReauthDialog({
  open,
  onOpenChange,
  action,
  onSuccess,
  title,
  description,
}: ReauthDialogProps) {
  const [password, setPassword] = useState('');
  const { reauthenticate, isReauthenticating } = useReauthentication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await reauthenticate(password);
    if (success) {
      setPassword('');
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {title || 'Verificação de Segurança'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description || `Para ${ACTION_DESCRIPTIONS[action]}, confirme sua senha.`}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reauth-password">Senha Atual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reauth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoFocus
                  disabled={isReauthenticating}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isReauthenticating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!password || isReauthenticating}>
              {isReauthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
