import { useState } from 'react';
import { Button, Badge } from '../ui';
import { Search, X, CalendarDays, DollarSign, Filter } from 'lucide-react';

export interface EventFilterValues {
  search: string;
  dateFrom: string;
  dateTo: string;
  minPriceDollars: string;
  maxPriceDollars: string;
  includePast: boolean;
}

interface EventSearchFiltersProps {
  values: EventFilterValues;
  onChange: (values: EventFilterValues) => void;
}

function countActiveFilters(values: EventFilterValues): number {
  let count = 0;
  if (values.search) count++;
  if (values.dateFrom) count++;
  if (values.dateTo) count++;
  if (values.minPriceDollars) count++;
  if (values.maxPriceDollars) count++;
  if (values.includePast) count++;
  return count;
}

const emptyFilters: EventFilterValues = {
  search: '',
  dateFrom: '',
  dateTo: '',
  minPriceDollars: '',
  maxPriceDollars: '',
  includePast: false,
};

export function EventSearchFilters({ values, onChange }: EventSearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = countActiveFilters(values);

  function update(partial: Partial<EventFilterValues>) {
    onChange({ ...values, ...partial });
  }

  function clearAll() {
    onChange({ ...emptyFilters });
  }

  return (
    <div className="space-y-3">
      {/* Search bar row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={values.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-8 text-sm ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50"
          />
          {values.search && (
            <button
              onClick={() => update({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="relative"
        >
          <Filter className="mr-1.5 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1.5 h-5 min-w-5 px-1 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="rounded-lg border border-input bg-card p-5 space-y-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date From */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={values.dateFrom}
                  onChange={(e) => update({ dateFrom: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {values.dateFrom && (
                  <button
                    onClick={() => update({ dateFrom: '' })}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={values.dateTo}
                  onChange={(e) => update({ dateTo: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {values.dateTo && (
                  <button
                    onClick={() => update({ dateTo: '' })}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Min Price */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Min Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={values.minPriceDollars}
                  onChange={(e) => update({ minPriceDollars: e.target.value })}
                  className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Max Price */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Max Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Any"
                  value={values.maxPriceDollars}
                  onChange={(e) => update({ maxPriceDollars: e.target.value })}
                  className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>

          {/* Include past events toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={values.includePast}
              onChange={(e) => update({ includePast: e.target.checked })}
              className="rounded border-input h-4 w-4"
            />
            <span className="text-muted-foreground">Include past events</span>
          </label>
        </div>
      )}

      {/* Active filter badges */}
      {activeCount > 0 && !expanded && (
        <div className="flex flex-wrap gap-2">
          {values.search && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: "{values.search}"
              <button onClick={() => update({ search: '' })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {values.dateFrom && (
            <Badge variant="secondary" className="gap-1 pr-1">
              From: {values.dateFrom}
              <button onClick={() => update({ dateFrom: '' })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {values.dateTo && (
            <Badge variant="secondary" className="gap-1 pr-1">
              To: {values.dateTo}
              <button onClick={() => update({ dateTo: '' })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {values.minPriceDollars && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Min: ${values.minPriceDollars}
              <button onClick={() => update({ minPriceDollars: '' })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {values.maxPriceDollars && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Max: ${values.maxPriceDollars}
              <button onClick={() => update({ maxPriceDollars: '' })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {values.includePast && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Including past
              <button onClick={() => update({ includePast: false })} className="hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
