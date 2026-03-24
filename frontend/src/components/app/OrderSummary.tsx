import { Card, CardContent, CardHeader, CardTitle, Separator, Badge } from '@/components/ui';
import { Receipt } from 'lucide-react';

interface LineItem {
  label: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

interface OrderSummaryProps {
  items: LineItem[];
  discountLabel?: string;
  discountAmount?: number;
  total: number;
}

export function OrderSummary({ items, discountLabel, discountAmount, total }: OrderSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Receipt className="h-4 w-4" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.label}
                {item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}
              </span>
              <span className="font-medium">${(item.total / 100).toFixed(2)}</span>
            </div>
          ))}

          {discountLabel && discountAmount && discountAmount > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="success" className="text-xs">
                    {discountLabel}
                  </Badge>
                  <span className="text-muted-foreground">Discount</span>
                </span>
                <span className="font-medium text-success">
                  -${(discountAmount / 100).toFixed(2)}
                </span>
              </div>
            </>
          )}

          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">${(total / 100).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
