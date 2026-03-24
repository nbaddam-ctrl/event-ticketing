import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

interface StatusPanelProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function StatusPanel({ icon: Icon, label, value, className }: StatusPanelProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-primary/10 p-3 dark:bg-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
