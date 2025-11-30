import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TableauEmbedProps {
  vizUrl: string;
  className?: string;
}

export function TableauEmbed({ vizUrl, className = '' }: TableauEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMobile = useIsMobile();

  // Build the proper embed URL with Tableau parameters
  const embedUrl = `${vizUrl}?:embed=y&:display_count=y&:showVizHome=no&:toolbar=yes`;
  
  // Fallback image from Tableau Public
  const fallbackImageUrl = 'https://public.tableau.com/static/images/We/WeeklyNationalRPMbyDivisionFinal/1_MapRPMbyModeandEquipNEWDash2/1.png';
  
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  // Mobile-optimized fallback: show static image + link to Tableau Public
  if (isMobile) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="overflow-hidden rounded-lg border border-border">
          <img 
            src={fallbackImageUrl} 
            alt="Market Insights Preview" 
            className="w-full"
          />
        </div>
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            For the best experience, view the interactive map on Tableau Public
          </p>
          <Button asChild className="w-full gap-2">
            <a 
              href={vizUrl}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View Interactive Map
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[600px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}

      {/* Error State with Fallback */}
      {error && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-6">
            <img 
              src={fallbackImageUrl} 
              alt="Market Insights Preview" 
              className="w-full rounded-lg"
            />
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
            <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
              Unable to load interactive visualization. View it directly on Tableau Public.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a 
                href={vizUrl}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View on Tableau Public
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Iframe Embed (Desktop/Tablet) */}
      {!error && (
        <iframe
          src={embedUrl}
          width="100%"
          height="827"
          frameBorder="0"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
          className={isLoading ? 'hidden' : 'rounded-lg'}
          style={{ maxHeight: '70vh', minHeight: '600px' }}
          title="Market Insights Visualization"
        />
      )}
    </div>
  );
}
