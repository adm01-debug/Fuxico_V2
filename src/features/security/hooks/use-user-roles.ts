import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserWithRole {
  user_id: string;
  email: string;
  role: 'admin' | 'user' | null;
  role_id: string | null;
  created_at: string | null;
}

// Fetch all users with their roles (admin only)
export function useUsersWithRoles() {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all users from email_audit_logs (unique emails)
      const { data: auditUsers, error: auditError } = await supabase
        .from('email_audit_logs')
        .select('user_id, user_email')
        .order('created_at', { ascending: false });

      if (auditError) throw auditError;

      // Get unique users
      const uniqueUsers = new Map<string, { user_id: string; email: string }>();
      auditUsers?.forEach(u => {
        if (!uniqueUsers.has(u.user_id)) {
          uniqueUsers.set(u.user_id, { user_id: u.user_id, email: u.user_email });
        }
      });

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Create role map
      const roleMap = new Map<string, { role: 'admin' | 'user'; role_id: string; created_at: string }>();
      roles?.forEach(r => {
        roleMap.set(r.user_id, { role: r.role, role_id: r.id, created_at: r.created_at });
      });

      // Also include users with roles that might not be in audit logs
      roles?.forEach(r => {
        if (!uniqueUsers.has(r.user_id)) {
          uniqueUsers.set(r.user_id, { user_id: r.user_id, email: `User ${r.user_id.slice(0, 8)}...` });
        }
      });

      // Combine data
      const usersWithRoles: UserWithRole[] = Array.from(uniqueUsers.values()).map(user => ({
        user_id: user.user_id,
        email: user.email,
        role: roleMap.get(user.user_id)?.role || null,
        role_id: roleMap.get(user.user_id)?.role_id || null,
        created_at: roleMap.get(user.user_id)?.created_at || null,
      }));

      return usersWithRoles.sort((a, b) => {
        // Admins first, then users, then no role
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        if (a.role === 'user' && b.role === null) return -1;
        if (a.role === null && b.role === 'user') return 1;
        return a.email.localeCompare(b.email);
      });
    },
  });
}

// Assign role to user
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
    },
  });
}

// Remove role from user
export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
    },
  });
}

// Alias for backwards compatibility
export const useUserRoles = useUsersWithRoles;

