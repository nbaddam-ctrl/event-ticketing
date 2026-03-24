import { Separator } from '@/components/ui';
import { Ticket } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">EventTix</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} EventTix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
