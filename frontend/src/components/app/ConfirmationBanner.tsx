import { motion, useReducedMotion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription, Button } from '@/components/ui';
import { XCircle } from 'lucide-react';

interface ConfirmationBannerProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ConfirmationBanner({ type, title, message, actionLabel, onAction }: ConfirmationBannerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: -8 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Alert variant={type === 'success' ? 'success' : 'error'}>
        <AlertTitle className="flex items-center gap-2">
          {type === 'success' ? (
            // <CheckCircle2 className="h-4 w-4 text-success" />
            null
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {title}
        </AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          {actionLabel && onAction && (
            <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
