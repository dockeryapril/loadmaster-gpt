import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  DollarSign,
  Truck,
  BarChart3,
  Edit,
  Calculator,
} from 'lucide-react';
import { Load } from '@/types/load';
import { SetupBanner } from './SetupBanner';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LoadEntryMethod } from './LoadEntryMethod';
import { LoadCalculator } from './LoadCalculator';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';

interface DashboardProps {
  loads: Load[];
  onEdit?: (load: Load) => void;
  loading?: boolean;
  onSaveLoad: (load: Omit<Load, 'id' | 'createdAt'>) => Promise<void> | void;
}

export function Dashboard({
  loads,
  onEdit,
  loading,
  onSaveLoad,
}: DashboardProps) {
  const [showSkeleton, setShowSkeleton] = useState(!!loading);
  const [contentVisible, setContentVisible] = useState(!loading);
  const [showCalculator, setShowCalculator] = useState(false);
  const [entryCollapsed, setEntryCollapsed] = useState(false);
  const [ocrData, setOcrData] = useState<Partial<Load> | null>(null);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      setContentVisible(true);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
      setContentVisible(false);
    }
  }, [loading]);

  const stats = {
    totalLoads: loads.length,
    avgRPM: loads.length > 0 ? loads.reduce((sum, load) => sum + load.rpm, 0) / loads.length : 0,
    totalRevenue: loads.reduce((sum, load) => sum + load.rate, 0),
    totalMiles: loads.reduce((sum, load) => sum + load.miles, 0),
    bestLoad: loads.length > 0 ? loads.reduce((best, load) => load.rpm > best.rpm ? load : best) : null
  };

  const recentLoads = loads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const getQualityDotColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-emerald-500';
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  const getQualityColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'good':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'fair':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'poor':
        return 'bg-red-500 hover:bg-red-600 text-white';
    }
  };

  const handleManualEntry = () => {
    setOcrData(null);
    setShowCalculator(true);
  };

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    const fieldsMap = result.detectedFields.reduce((acc, field) => {
      acc[field.field] = field.value;
      return acc;
    }, {} as Record<string, string>);

    const data: Partial<Load> = {
      origin: fieldsMap.origin || '',
      destination: fieldsMap.destination || '',
      miles: fieldsMap.miles ? parseFloat(fieldsMap.miles) : undefined,
      rate: fieldsMap.rate ? parseFloat(fieldsMap.rate) : undefined,
      fsc: fieldsMap.fsc ? parseFloat(fieldsMap.fsc) : undefined,
      weight: fieldsMap.weight ? parseFloat(fieldsMap.weight) : undefined,
      deadheadMiles: fieldsMap.deadhead ? parseFloat(fieldsMap.deadhead) : undefined,
      fuelCost: fieldsMap.fuelCost ? parseFloat(fieldsMap.fuelCost) : undefined,
      tolls: fieldsMap.tolls ? parseFloat(fieldsMap.tolls) : undefined,
      notes: '',
    };

    setOcrData(data);
    setShowCalculator(true);
  };

  const handleCloseCalculator = () => {
    setShowCalculator(false);
    setOcrData(null);
  };

  const handleSaveLoad = async (loadData: Omit<Load, 'id' | 'createdAt'>) => {
    await onSaveLoad(loadData);
    handleCloseCalculator();
  };

  return (
    <>
      <main className="space-y-6">
        {!showCalculator && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEntryCollapsed(!entryCollapsed)}
            >
              {entryCollapsed ? 'Show entry options' : 'Hide entry options'}
            </Button>
          </div>
        )}
        {!entryCollapsed && !showCalculator && (
          <div id="entry-section">
            <LoadEntryMethod
              onFieldsDetected={handleFieldsDetected}
              onManualEntry={handleManualEntry}
            />
          </div>
        )}
        {showCalculator && (
          <LoadCalculator
            onSaveLoad={handleSaveLoad}
            ocrData={ocrData || undefined}
            onClose={handleCloseCalculator}
          />
        )}
        {/* Setup Banner */}
        <SetupBanner />

      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="icon-badge bg-primary/10">
            <Truck className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          LoadMaster GPT
        </h1>
        <p className="text-muted-foreground">Smart Load Analysis for Owner-Operators</p>
      </header>

      {/* Stats Grid */}
      <section aria-labelledby="stats-heading" className="relative">
        <h2 id="stats-heading" className="sr-only">Dashboard statistics</h2>
        {showSkeleton && (
          <div className={cn(
            "grid grid-cols-2 gap-4 transition-opacity duration-500",
            loading ? "opacity-100" : "opacity-0"
          )}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 text-center">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-6 mx-auto" />
                  <Skeleton className="h-6 w-16 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {loads.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-2 gap-4 transition-opacity duration-500",
              contentVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <Card className="p-4 text-center">
              <div className="space-y-2">
                <TrendingUp className="h-6 w-6 text-primary mx-auto" />
                <div className="text-2xl font-bold">${stats.avgRPM.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Avg RPM</div>
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="space-y-2">
                <Truck className="h-6 w-6 text-primary mx-auto" />
                <div className="text-2xl font-bold">{stats.totalLoads}</div>
                <div className="text-sm text-muted-foreground">Total Loads</div>
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="space-y-2">
                <DollarSign className="h-6 w-6 text-primary mx-auto" />
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </Card>

            <Card className="p-4 text-center">
              <div className="space-y-2">
                <BarChart3 className="h-6 w-6 text-primary mx-auto" />
                <div className="text-2xl font-bold">{stats.totalMiles.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Miles</div>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Best Load */}
      <section aria-labelledby="best-load-heading" className="relative">
        {showSkeleton && (
          <Card
            className={cn(
              "p-4 transition-opacity duration-500",
              loading ? "opacity-100" : "opacity-0"
            )}
          >
            <Skeleton className="h-20 w-full" />
          </Card>
        )}

        {stats.bestLoad && stats.bestLoad.rpm > 0 && (
          <Card
            className={cn(
              "p-4 transition-opacity duration-500",
              contentVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <h2 id="best-load-heading" className="font-semibold">Best Load</h2>
                <p className="text-sm text-muted-foreground">Highest RPM this period</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium">{stats.bestLoad.origin} → {stats.bestLoad.destination}</div>
                <div className="text-xs text-muted-foreground">{stats.bestLoad.miles} miles</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-success">${stats.bestLoad.rpm.toFixed(2)}/mi</div>
                  <div className="text-xs">${stats.bestLoad.rate.toLocaleString()}</div>
                </div>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(stats.bestLoad!)}
                    className="h-8 w-8 p-0"
                    aria-label="Edit best load"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </section>
      {/* Get Started Banner when no loads */}
      {!loading && loads.length === 0 && (
        <Card
          className={cn(
            "p-8 text-center transition-opacity duration-500",
            contentVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Get Started</h2>
            <p className="text-sm text-muted-foreground">
              Use the entry options above to add your first load.
            </p>
            <Button
              onClick={() => {
                setEntryCollapsed(false);
                document
                  .getElementById('entry-section')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get Started
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Loads */}
      <section aria-labelledby="recent-loads-heading" className="relative">
        {showSkeleton && (
          <div
            className={cn(
              "space-y-4 mb-8 transition-opacity duration-500",
              loading ? "opacity-100" : "opacity-0"
            )}
          >
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-12 w-full" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {recentLoads.length > 0 && (
          <div
            className={cn(
              "space-y-4 mb-8 transition-opacity duration-500",
              contentVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <h2 id="recent-loads-heading" className="text-lg font-semibold">Recent Loads</h2>
            <div className="space-y-2">
              {recentLoads.map((load) => (
                <Card key={load.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${getQualityDotColor(load.quality)}`} />
                      <div>
                        <div className="text-sm font-medium">{load.origin} → {load.destination}</div>
                        <div className="text-xs text-muted-foreground">{load.miles} mi • ${load.rate.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getQualityColor(load.quality)}>
                        ${load.rpm.toFixed(2)}/mi
                      </Badge>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(load)}
                          className="h-8 w-8 p-0"
                          aria-label="Edit load"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      </main>

      {/* Add Load Button */}
      <Button
        className="fixed bottom-24 right-4 flex items-center gap-2 shadow-lg"
        onClick={handleManualEntry}
      >
        <div className="p-1 rounded bg-primary/20">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm">Add Load</span>
      </Button>
    </>
  );
}
