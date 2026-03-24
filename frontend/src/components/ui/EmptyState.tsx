import * as React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
      {...props}
    >
      <div className="mb-5 rounded-full bg-muted p-4 text-muted-foreground">
        {icon || <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export { EmptyState };
