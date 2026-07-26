import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that redirects unauthenticated users to /auth.
 * Shows a loading skeleton while auth state is being determined.
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" role="status" aria-label="Verificando autenticação">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
