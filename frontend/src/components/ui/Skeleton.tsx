import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangle' | 'circle' | 'text';
}

function Skeleton({ className, variant = 'rectangle', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-muted/80 dark:bg-muted/50',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 w-3/4 rounded',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
