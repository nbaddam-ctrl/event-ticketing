import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

function Spinner({ size = 'md', label, className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="status"
      aria-label={label || 'Loading'}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

export { Spinner };
