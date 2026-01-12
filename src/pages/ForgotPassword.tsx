import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, Clock, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      // Check if user exists by trying to get their data
      // We create a reset request that requires admin approval
      const { error: insertError } = await supabase
        .from('password_reset_requests')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder, will be updated by admin
          email: email.toLowerCase().trim(),
          status: 'pending',
          ip_address: null, // Could be captured via edge function
          user_agent: navigator.userAgent,
        });

      if (insertError) {
        // Check for unique constraint or other errors
        if (insertError.message.includes('duplicate')) {
          toast.info('Já existe uma solicitação pendente para este email');
        } else {
          throw insertError;
        }
      }

      setSent(true);
      toast.success('Solicitação enviada! Aguarde aprovação.');
    } catch (err) {
      console.error('Reset request error:', err);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <CardTitle>Solicitação Enviada!</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                Sua solicitação de redefinição de senha para <strong>{email}</strong> foi recebida.
              </p>
              <p className="text-warning">
                Um administrador irá analisar e aprovar sua solicitação.
              </p>
              <p>
                Após a aprovação, você receberá um email com o link para redefinir sua senha.
              </p>
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                O processo de aprovação pode levar algumas horas. Se sua solicitação for rejeitada, 
                entre em contato com o suporte.
              </span>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Enviar outra solicitação
            </Button>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary">
              Voltar para login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para login
          </Link>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos uma solicitação de redefinição. 
            Um administrador precisará aprovar antes do envio do link.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar redefinição de senha'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
