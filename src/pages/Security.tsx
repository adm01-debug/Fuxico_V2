import { SecurityDashboard } from '@/components/security';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Security() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <SecurityDashboard />
      </div>
    </div>
  );
}
