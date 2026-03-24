import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const toastVariants = cva(
  'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-success/50 bg-success/10 text-foreground',
        error: 'border-destructive/50 bg-destructive/10 text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: null,
  success: CheckCircle2,
  error: AlertCircle,
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

function Toast({ message, variant, onDismiss, className }: ToastProps) {
  const Icon = iconMap[variant ?? 'default'];

  return (
    <div className={cn(toastVariants({ variant }), className)} role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; variant?: 'default' | 'success' | 'error' }>;
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-w-md flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

export { Toast, ToastContainer };
