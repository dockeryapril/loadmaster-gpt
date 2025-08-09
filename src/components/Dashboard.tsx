import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, DollarSign, Truck, BarChart3, Edit } from 'lucide-react';
import { Load } from '@/types/load';
import { SetupBanner } from './SetupBanner';

interface DashboardProps {
  loads: Load[];
  onAddLoad: () => void;
  onEdit?: (load: Load) => void;
}

export function Dashboard({ loads, onAddLoad, onEdit }: DashboardProps) {
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
    <div className="space-y-6">
      {/* Setup Banner */}
      <SetupBanner />
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
          LoadMaster GPT
        </h1>
        <p className="text-muted-foreground">Smart Load Analysis for Owner-Operators</p>
      </div>

      {/* Add Load CTA */}
      <Card className="p-6 gradient-card text-center">
        <div className="space-y-4">
          <div className="p-3 rounded-full bg-primary/20 w-fit mx-auto">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Ready to analyze a new load?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Calculate RPM, evaluate weight impact, and make smart decisions in seconds
            </p>
            <Button 
              onClick={onAddLoad}
              className="gradient-primary border-0 h-12 px-8 text-lg font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Load
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      {loads.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
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

      {/* Best Load */}
      {stats.bestLoad && stats.bestLoad.rpm > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/20">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Best Load</h3>
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
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Loads */}
      {recentLoads.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-lg font-semibold">Recent Loads</h3>
          <div className="space-y-2">
            {recentLoads.map((load) => (
              <Card key={load.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span>{getQualityIcon(load.quality)}</span>
                    <div>
                      <div className="text-sm font-medium">{load.origin} → {load.destination}</div>
                      <div className="text-xs text-muted-foreground">{load.miles} mi • ${load.rate.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={load.quality === 'excellent' || load.quality === 'good' ? 'default' : 'destructive'}>
                      ${load.rpm.toFixed(2)}/mi
                    </Badge>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(load)}
                        className="h-8 w-8 p-0"
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

      {/* Empty State */}
      {loads.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No loads analyzed yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first load to see RPM calculations and analytics
              </p>
              <Button variant="outline" onClick={onAddLoad}>
                Get Started
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}