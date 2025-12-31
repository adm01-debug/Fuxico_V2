import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogIn,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Loader2
} from 'lucide-react';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  success: boolean;
  user_agent: string | null;
  created_at: string;
}

interface LoginAttemptsPanelProps {
  limit?: number;
}

export default function LoginAttemptsPanel({ limit = 20 }: LoginAttemptsPanelProps) {
  // Fetch login attempts
  const { data: attempts, isLoading } = useQuery({
    queryKey: ['loginAttempts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LoginAttempt[];
    },
    refetchInterval: 30000,
  });

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `***@${domain}`;
    return `${local.substring(0, 3)}***@${domain}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LogIn className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Tentativas de Login</CardTitle>
            <CardDescription>
              Histórico de tentativas de autenticação
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : attempts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma tentativa de login registrada
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {attempts?.map((attempt) => (
              <div
                key={attempt.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  attempt.success 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${
                    attempt.success ? 'bg-green-500/10' : 'bg-destructive/10'
                  }`}>
                    {attempt.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{maskEmail(attempt.email)}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {attempt.ip_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(attempt.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={attempt.success ? 'default' : 'destructive'}>
                  {attempt.success ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
