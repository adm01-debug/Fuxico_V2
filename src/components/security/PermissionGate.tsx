import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRole } from '@/hooks/useRole';

interface PermissionGateProps {
  children: ReactNode;
  /** Required permission key(s) */
  permission?: string | string[];
  /** Require all permissions (AND) or any permission (OR) */
  requireAll?: boolean;
  /** Required role(s) */
  role?: 'admin' | 'user' | ('admin' | 'user')[];
  /** Fallback content when access is denied */
  fallback?: ReactNode;
  /** If true, shows nothing when access is denied (instead of fallback) */
  silent?: boolean;
}

export function PermissionGate({
  children,
  permission,
  requireAll = false,
  role,
  fallback = null,
  silent = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading: permLoading } = usePermissions();
  const { hasRole, isAdmin, isLoading: roleLoading } = useRole();

  // Still loading - show nothing to prevent flash
  if (permLoading || roleLoading) {
    return null;
  }

  // Admin always has access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check role requirement
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = roles.some(r => hasRole(r));
    
    if (!hasRequiredRole) {
      return silent ? null : <>{fallback}</>;
    }
  }

  // Check permission requirement
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    const hasRequiredPermission = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermission) {
      return silent ? null : <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Higher-order component version
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string | string[],
  options?: {
    requireAll?: boolean;
    fallback?: ReactNode;
  }
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGate
        permission={permission}
        requireAll={options?.requireAll}
        fallback={options?.fallback}
      >
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}

// Hook to check permissions imperatively
export function usePermissionCheck() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { hasRole, isAdmin } = useRole();

  const canAccess = (
    permission?: string | string[],
    role?: 'admin' | 'user' | ('admin' | 'user')[],
    requireAll = false
  ): boolean => {
    // Admin always has access
    if (isAdmin) return true;

    // Check role
    if (role) {
      const roles = Array.isArray(role) ? role : [role];
      if (!roles.some(r => hasRole(r))) return false;
    }

    // Check permission
    if (permission) {
      const perms = Array.isArray(permission) ? permission : [permission];
      return requireAll ? hasAllPermissions(perms) : hasAnyPermission(perms);
    }

    return true;
  };

  return { canAccess };
}
