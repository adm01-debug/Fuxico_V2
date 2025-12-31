import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'user';

export function useRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const hasRole = (role: AppRole): boolean => {
    if (!roles) return false;
    return roles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isUser = hasRole('user');

  return {
    roles: roles || [],
    isLoading,
    error,
    hasRole,
    isAdmin,
    isUser,
  };
}
