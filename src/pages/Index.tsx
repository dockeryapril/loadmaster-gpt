import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Calculator, LogOut, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import { Load } from '@/types/load';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseLoads } from '@/hooks/useSupabaseLoads';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { Dashboard } from '@/components/Dashboard';
import { LoadCalculator } from '@/components/LoadCalculator';
import { LoadCard } from '@/components/LoadCard';
import { Settings } from '@/components/Settings';
import { LoadEntryMethod } from '@/components/LoadEntryMethod';
import { useToast } from '@/hooks/use-toast';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';

type View = 'dashboard' | 'calculator' | 'history' | 'settings' | 'entry-method';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { loads, loading: loadsLoading, saveLoad, deleteLoad, updateLoad } = useSupabaseLoads();
  const { settings } = useSupabaseSettings();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveLoad = async (loadData: Omit<Load, 'id' | 'createdAt'>) => {
    try {
      if (editingLoad) {
        // Update existing load
        await updateLoad(editingLoad.id, loadData);
        setEditingLoad(null);
      } else {
        // Add new load
        await saveLoad(loadData);
      }
      setCurrentView('dashboard');
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleDeleteLoad = async (id: string) => {
    await deleteLoad(id);
  };

  const handleEditLoad = (load: Load) => {
    setEditingLoad(load);
    setCurrentView('calculator');
  };

  const handleAddNewLoad = () => {
    setEditingLoad(null);
    setCurrentView('entry-method');
  };

  const handleManualEntry = () => {
    setEditingLoad(null);
    setCurrentView('calculator');
  };

  const handleOCRFieldsDetected = (result: FieldDetectionResult) => {
    // Convert detectedFields array to an object for easier access
    const fieldsMap = result.detectedFields.reduce((acc, field) => {
      acc[field.field] = field.value;
      return acc;
    }, {} as Record<string, string>);

    // Create a partial Load object from the OCR result
    const ocrLoad: Partial<Load> = {
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
    
    // Set as editing load to pre-populate the calculator
    setEditingLoad(ocrLoad as Load);
    setCurrentView('calculator');
  };

  const renderHeader = () => {
    if (currentView === 'dashboard') {
      return (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">LoadMaster</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('settings')}
              className="p-2"
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="p-2"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
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
          {currentView === 'calculator' ? (editingLoad ? 'Edit Load' : 'New Load') : 
           currentView === 'history' ? 'Load History' : 
           currentView === 'settings' ? 'Settings' : 'Add New Load'}
        </h1>
      </div>
    );
  };

  const renderBottomNav = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-safe">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              className="flex flex-col h-16 gap-1"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="p-1 rounded bg-primary/20">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs">Dashboard</span>
            </Button>
            
            <Button
              variant={currentView === 'calculator' || currentView === 'entry-method' ? 'default' : 'ghost'}
              className="flex flex-col h-16 gap-1"
              onClick={handleAddNewLoad}
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

            <Button
              variant={currentView === 'settings' ? 'default' : 'ghost'}
              className="flex flex-col h-16 gap-1"
              onClick={() => setCurrentView('settings')}
            >
              <div className="p-1 rounded bg-primary/20">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'entry-method':
        return (
          <LoadEntryMethod
            onFieldsDetected={handleOCRFieldsDetected}
            onManualEntry={handleManualEntry}
            onClose={() => setCurrentView('dashboard')}
          />
        );

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

      case 'settings':
        return (
          <Settings
            onClose={() => setCurrentView('dashboard')}
          />
        );
      
      case 'history':
        if (loadsLoading) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading your loads...</p>
            </div>
          );
        }
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
                    onClick={handleAddNewLoad}
                    className=""
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
                    onClick={handleAddNewLoad}
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
        if (loadsLoading) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading dashboard...</p>
            </div>
          );
        }
        return (
          <Dashboard
            loads={loads}
            onAddLoad={handleAddNewLoad}
            onEdit={handleEditLoad}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6 pb-36">
        {renderHeader()}
        {renderContent()}
      </div>
      {renderBottomNav()}
    </div>
  );
};

export default Index;