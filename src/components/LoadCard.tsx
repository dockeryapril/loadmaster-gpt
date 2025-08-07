import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, DollarSign, Weight, Trash2 } from 'lucide-react';
import { Load } from '@/types/load';
import { format } from 'date-fns';

interface LoadCardProps {
  load: Load;
  onDelete?: (id: string) => void;
  onEdit?: (load: Load) => void;
}

export function LoadCard({ load, onDelete, onEdit }: LoadCardProps) {
  const getQualityColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-success text-success-foreground';
      case 'good':
        return 'bg-success/80 text-success-foreground';
      case 'fair':
        return 'bg-warning text-warning-foreground';
      case 'poor':
        return 'bg-destructive text-destructive-foreground';
    }
  };

  const getQualityIcon = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return '🟢';
      case 'fair':
        return '🟡';
      case 'poor':
        return '🔴';
    }
  };

  return (
    <Card className="p-4 space-y-3 hover:bg-card/80 transition-colors animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getQualityIcon(load.quality)}</span>
          <Badge className={getQualityColor(load.quality)}>
            ${load.rpm.toFixed(2)}/mi
          </Badge>
          <Badge variant="outline" className="text-xs">
            {load.quality.toUpperCase()}
          </Badge>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(load.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">{load.origin}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{load.destination}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>{load.miles} mi</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${load.rate.toLocaleString()}</span>
          </div>
        </div>

        {load.weight && (
          <div className="flex items-center gap-2 text-sm">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span>{load.weight.toLocaleString()} lbs</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>{format(load.createdAt, 'MMM d, h:mm a')}</span>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(load)}
              className="h-6 px-2 text-xs"
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}