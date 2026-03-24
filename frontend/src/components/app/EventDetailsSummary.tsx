import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from '@/components/ui';
import { MapPin, DollarSign, Users } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  priceMinor: number;
  remainingQuantity: number;
}

interface EventDetailsSummaryProps {
  title: string;
  description: string | null;
  venueName: string;
  tiers: Tier[];
}

export function EventDetailsSummary({ title, description, venueName, tiers }: EventDetailsSummaryProps) {
  const totalCapacity = tiers.reduce((sum, t) => sum + t.remainingQuantity, 0);
  const minPrice = Math.min(...tiers.map((t) => t.priceMinor));
  const hasAvailability = totalCapacity > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
          <Badge variant={hasAvailability ? 'success' : 'destructive'} className="shrink-0">
            {hasAvailability ? 'Available' : 'Sold Out'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{venueName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0 text-primary" />
            <span>From ${(minPrice / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <span>{totalCapacity} tickets left</span>
          </div>
        </div>
        <Separator className="my-4" />
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ticket Tiers
        </h3>
      </CardContent>
    </Card>
  );
}
