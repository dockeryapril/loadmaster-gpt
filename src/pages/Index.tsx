import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Calculator, LogOut } from 'lucide-react';
import { Load } from '@/types/load';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { LoadCalculator } from '@/components/LoadCalculator';
import { LoadCard } from '@/components/LoadCard';
import { useToast } from '@/hooks/use-toast';

type View = 'dashboard' | 'calculator' | 'history';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loads, setLoads] = useLocalStorage<Load[]>('loadmaster-loads', []);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      window.location.href = '/auth';
    }
  };

  const handleSaveLoad = (loadData: Omit<Load, 'id' | 'createdAt'>) => {
    if (editingLoad) {
      // Update existing load
      const updatedLoads = loads.map(load => 
        load.id === editingLoad.id 
          ? { ...loadData, id: editingLoad.id, createdAt: editingLoad.createdAt }
          : load
      );
      setLoads(updatedLoads);
      setEditingLoad(null);
      toast({
        title: "Load Updated",
        description: "Your load has been successfully updated.",
      });
    } else {
      // Add new load
      const newLoad: Load = {
        ...loadData,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      setLoads([newLoad, ...loads]);
      toast({
        title: "Load Saved",
        description: `Load from ${loadData.origin} to ${loadData.destination} saved successfully.`,
      });
    }
    setCurrentView('dashboard');
  };

  const handleDeleteLoad = (id: string) => {
    setLoads(loads.filter(load => load.id !== id));
    toast({
      title: "Load Deleted",
      description: "Load has been removed from your history.",
      variant: "destructive"
    });
  };

  const handleEditLoad = (load: Load) => {
    setEditingLoad(load);
    setCurrentView('calculator');
  };

  const renderHeader = () => {
    if (currentView === 'dashboard') {
      return (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">LoadMaster</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="p-2"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentView('dashboard');
            setEditingLoad(null);
          }}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {currentView === 'calculator' ? (editingLoad ? 'Edit Load' : 'New Load') : 'Load History'}
        </h1>
      </div>
    );
  };

  const renderBottomNav = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-safe">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              className="flex flex-col h-16 gap-1"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="p-1 rounded bg-primary/20">
                <span className="text-lg">📊</span>
              </div>
              <span className="text-xs">Dashboard</span>
            </Button>
            
            <Button
              variant="ghost"
              className="flex flex-col h-16 gap-1"
              onClick={() => setCurrentView('calculator')}
            >
              <div className="p-1 rounded bg-primary/20">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs">Calculate</span>
            </Button>
            
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              className="flex flex-col h-16 gap-1"
              onClick={() => setCurrentView('history')}
            >
              <div className="p-1 rounded bg-primary/20">
                <History className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs">History</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'calculator':
        return (
          <LoadCalculator
            onSaveLoad={handleSaveLoad}
            initialData={editingLoad || undefined}
            onClose={() => {
              setCurrentView('dashboard');
              setEditingLoad(null);
            }}
          />
        );
      
      case 'history':
        return (
          <div className="space-y-4">
            {loads.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No load history</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your analyzed loads will appear here
                  </p>
                  <Button 
                    onClick={() => setCurrentView('calculator')}
                    className="gradient-primary border-0"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate First Load
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">All Loads ({loads.length})</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentView('calculator')}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    New Load
                  </Button>
                </div>
                
                {loads.map((load) => (
                  <LoadCard
                    key={load.id}
                    load={load}
                    onDelete={handleDeleteLoad}
                    onEdit={handleEditLoad}
                  />
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <Dashboard
            loads={loads}
            onAddLoad={() => setCurrentView('calculator')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {renderHeader()}
        {renderContent()}
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default Index;