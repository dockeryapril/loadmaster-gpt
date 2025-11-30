import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TableauEmbedProps {
  vizUrl: string;
  className?: string;
}

export function TableauEmbed({ vizUrl, className = '' }: TableauEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vizRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Tableau API is already loaded
    if ((window as any).tableau) {
      initViz();
      return;
    }

    // Load Tableau API script
    const script = document.createElement('script');
    script.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    script.async = true;
    
    script.onload = () => {
      setIsLoading(false);
      initViz();
    };

    script.onerror = () => {
      setError('Failed to load Tableau visualization');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      if (vizRef.current) {
        vizRef.current.dispose();
      }
    };
  }, [vizUrl]);

  const initViz = () => {
    if (!containerRef.current || vizRef.current) return;

    try {
      const options = {
        hideTabs: false,
        hideToolbar: false,
        width: '100%',
        height: '827px',
        onFirstInteractive: () => {
          setIsLoading(false);
        }
      };

      if ((window as any).tableau) {
        vizRef.current = new (window as any).tableau.Viz(
          containerRef.current,
          vizUrl,
          options
        );
      }
    } catch (err) {
      console.error('Error initializing Tableau viz:', err);
      setError('Error loading visualization');
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[600px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`tableau-viz ${isLoading ? 'hidden' : ''}`}
        style={{ minHeight: '827px' }}
      />
    </div>
  );
}
