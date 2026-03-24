import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, Badge } from '@/components/ui';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  venueName: string;
  startAt?: string;
  className?: string;
}

export function EventCard({ id, title, venueName, startAt, className }: EventCardProps) {
  const formattedDate = startAt
    ? new Date(startAt).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link to={`/events/${id}`} className="group block no-underline">
      <Card
        className={cn(
          'overflow-hidden hover:shadow-lg hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2',
          className
        )}
      >
        {/* Gradient header area */}
        <div className="h-28 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/30 dark:from-primary/50 dark:via-primary/30 dark:to-primary/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        </div>

        <CardContent className="p-5">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary/70" />
                <span className="truncate max-w-[180px]">{venueName}</span>
              </span>
              {formattedDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  {formattedDate}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <Badge variant="secondary" className="text-xs">
                View Details
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
