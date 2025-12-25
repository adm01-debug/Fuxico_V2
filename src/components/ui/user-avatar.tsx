import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string;
  name?: string;
  status?: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ src, name, status, size = 'md', className }: UserAvatarProps) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
  const statusColors = { online: 'bg-green-500', offline: 'bg-gray-400', away: 'bg-yellow-500' };
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  
  return (
    <div className="relative">
      <Avatar className={cn(sizes[size], className)}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {status && (
        <span className={cn('absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background', statusColors[status])} />
      )}
    </div>
  );
}
