import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Lightbulb, X, Truck, DollarSign, CheckCircle } from 'lucide-react';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';
import { BusinessSetup, businessSetupSections, shouldShowQuestion, calculateCompletionPercentage } from '@/types/businessSetup';
import { QuestionCard } from './QuestionCard';
import { SetupPreview } from './SetupPreview';
import { BusinessSetupValidationSummary } from './BusinessSetupValidationSummary';
import { useToast } from '@/components/ui/use-toast';

// Quick setup templates from the removed SimpleBusinessSetup
const SETUP_TEMPLATES = [
  {
    name: '75/25 Lease',
    revenueSplit: 75,
    weeklyCosts: 400,
    description: 'Company provides truck, insurance, maintenance',
    setupData: {
      revenue_split_percentage: 75,
      weekly_truck_payment: 240, // 60% of 400
      weekly_insurance_payment: 120, // 30% of 400
      weekly_escrow_payment: 40, // 10% of 400
      pay_structure_type: 'gross_revenue' as const,
      fuel_responsibility: 'driver_pays' as const,
      maintenance_coverage: 'carrier_full' as const,
      insurance_responsibility: 'carrier_pays' as const,
      toll_responsibility: 'driver_pays' as const,
      deadhead_compensation_type: 'per_mile' as const,
      deadhead_compensation_rate: 0.50,
      fsc_handling: 'driver_receives_fsc' as const,
    }
  },
  {
    name: 'Independent Contractor',
    revenueSplit: 95,
    weeklyCosts: 100,
    description: 'Own your truck, pay basic operational costs',
    setupData: {
      revenue_split_percentage: 95,
      weekly_truck_payment: 0,
      weekly_insurance_payment: 60,
      weekly_escrow_payment: 40,
      pay_structure_type: 'percentage_split' as const,
      fuel_responsibility: 'driver_pays' as const,
      maintenance_coverage: 'driver_full' as const,
      insurance_responsibility: 'driver_pays' as const,
      toll_responsibility: 'driver_pays' as const,
      deadhead_compensation_type: 'per_mile' as const,
      deadhead_compensation_rate: 0.75,
      fsc_handling: 'driver_receives_fsc' as const,
    }
  },
  {
    name: 'Company Driver',
    revenueSplit: 35,
    weeklyCosts: 0,
    description: 'Salary/percentage with no equipment costs',
    setupData: {
      revenue_split_percentage: 35,
      weekly_truck_payment: 0,
      weekly_insurance_payment: 0,
      weekly_escrow_payment: 0,
      pay_structure_type: 'gross_revenue' as const,
      fuel_responsibility: 'carrier_pays' as const,
      maintenance_coverage: 'carrier_full' as const,
      insurance_responsibility: 'carrier_pays' as const,
      toll_responsibility: 'carrier_pays' as const,
      deadhead_compensation_type: 'per_mile' as const,
      deadhead_compensation_rate: 0.50,
      fsc_handling: 'carrier_keeps_fsc' as const,
    }
  }
];

interface BusinessSetupWizardProps {
  onClose?: () => void;
  onComplete?: () => void;
  mode?: 'modal' | 'page';
}

export const BusinessSetupWizard = ({ 
  onClose, 
  onComplete, 
  mode = 'modal' 
}: BusinessSetupWizardProps) => {
  const { toast } = useToast();
  const { 
    setup, 
    loading, 
    saving, 
    saveSetup, 
    updateSetup, 
    getCompletionPercentage,
    generateSetupSuggestions 
  } = useBusinessSetup();

  const [currentStep, setCurrentStep] = useState(0);
  const [currentSectionIndex, setSectionIndex] = useState(0);
  const [currentQuestionIndex, setQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<BusinessSetup>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<BusinessSetup> | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Get all visible questions for current section
  const currentSection = businessSetupSections[currentSectionIndex];
  const visibleQuestions = currentSection?.questions.filter(q => 
    shouldShowQuestion(q, formData)
  ) || [];
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Calculate total progress
  const totalSections = businessSetupSections.length;
  const sectionProgress = currentSectionIndex / totalSections;
  const questionProgress = visibleQuestions.length > 0 
    ? currentQuestionIndex / visibleQuestions.length 
    : 0;
  const overallProgress = ((currentSectionIndex + questionProgress) / totalSections) * 100;

  // Initialize form data from existing setup
  useEffect(() => {
    if (setup) {
      setFormData(setup);
      
      // Check URL params for forcing template screen
      const urlParams = new URLSearchParams(window.location.search);
      const showTemplatesParam = urlParams.get('templates');
      const debugMode = urlParams.get('debug') === '1';
      
      if (showTemplatesParam === 'true') {
        if (debugMode) console.log('🔧 BusinessSetup: URL param forcing template screen');
        setShowTemplates(true);
        return;
      }
      
      // Only auto-skip the template chooser for users who have essentially completed setup
      const completionPercentage = calculateCompletionPercentage(setup);
      const setupFinished = Boolean(setup.setup_completed_at);
      const shouldSkipTemplates = setupFinished || completionPercentage >= 80;

      if (debugMode) {
        console.log('🔧 BusinessSetup: Completion percentage:', completionPercentage);
        console.log('🔧 BusinessSetup: Setup finished:', setupFinished);
        console.log('🔧 BusinessSetup: Should skip templates:', shouldSkipTemplates);
      }

      if (shouldSkipTemplates) {
        setShowTemplates(false);
      } else {
        setShowTemplates(true);
      }
    }
  }, [setup]);

  // Load AI suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      const aiSuggestions = await generateSetupSuggestions();
      if (aiSuggestions) {
        setSuggestions(aiSuggestions);
      }
    };
    loadSuggestions();
  }, []);

  const handleAnswerChange = (questionId: keyof BusinessSetup, value: any) => {
    const newFormData = { ...formData, [questionId]: value };
    setFormData(newFormData);
    
    // Auto-save progress on each answer
    updateSetup({ [questionId]: value });
  };

  const handleNext = () => {
    // Check current form data completion instead of saved data
    const currentCompletion = calculateCompletionPercentage(formData);
    
    // If current form setup is complete, go directly to preview
    if (currentCompletion === 100) {
      setShowPreview(true);
      return;
    }

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < businessSetupSections.length - 1) {
      setSectionIndex(currentSectionIndex + 1);
      setQuestionIndex(0);
    } else {
      // Show completion preview
      setShowPreview(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = businessSetupSections[currentSectionIndex - 1];
      const prevVisibleQuestions = prevSection.questions.filter(q => 
        shouldShowQuestion(q, formData)
      );
      setSectionIndex(currentSectionIndex - 1);
      setQuestionIndex(Math.max(0, prevVisibleQuestions.length - 1));
    }
  };

  const handleComplete = async () => {
    // Final validation before completion
    const completionPercentage = calculateCompletionPercentage(formData);
    
    if (completionPercentage < 100) {
      toast({
        title: "Setup Incomplete",
        description: `Please complete all required fields (${completionPercentage}% complete)`,
        variant: "destructive",
      });
      setShowPreview(false); // Show main form with validation
      return;
    }
    
    const success = await saveSetup(formData);
    if (success) {
      toast({
        title: "Setup Complete!",
        description: "Your business setup is saved. Load calculations will now be personalized.",
      });
      // Add small delay to ensure data is saved before calling completion callback
      setTimeout(() => {
        onComplete?.();
        onClose?.();
      }, 100);
    }
  };

  const handleSkipToEnd = () => {
    const completionPercentage = calculateCompletionPercentage(formData);
    if (completionPercentage < 100) {
      // Show validation summary instead of preview
      setShowPreview(false);
      toast({
        title: "Setup Incomplete",
        description: `Please complete the required fields below (${completionPercentage}% complete)`,
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const applySuggestion = (field: keyof BusinessSetup, value: any) => {
    handleAnswerChange(field, value);
    toast({
      title: "Suggestion Applied",
      description: "AI suggestion has been applied to your setup",
    });
  };

  // Template selection handlers
  const applyTemplate = async (templateIndex: number) => {
    const template = SETUP_TEMPLATES[templateIndex];
    if (!template) return;
    
    const templateData = {
      ...template.setupData,
      equipment_type: 'cargo_van' as const, // Default equipment, user can change later
    };
    
    setFormData(templateData);
    setSelectedTemplate(template.name);
    
    // Save template to setup
    await updateSetup(templateData);
    
    toast({
      title: `${template.name} template applied`,
      description: "Your setup has been pre-filled. You can modify any answers as you go through the wizard.",
    });
  };

  const startCustomSetup = () => {
    setShowTemplates(false);
  };

  const startWithTemplate = () => {
    if (selectedTemplate) {
      setShowTemplates(false);
    }
  };

  if (showTemplates) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Business Setup
          </CardTitle>
          <CardDescription>
            Choose a template to get started quickly, or set up from scratch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Setup Templates</h3>
            <div className="grid gap-3">
              {SETUP_TEMPLATES.map((template, index) => (
                <Card 
                  key={template.name}
                  className={`cursor-pointer border-2 transition-all hover:border-primary/50 ${
                    selectedTemplate === template.name 
                      ? 'border-primary ring-1 ring-primary/20 bg-primary/5' 
                      : 'border-border'
                  }`}
                  onClick={() => applyTemplate(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {template.revenueSplit}% split
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Weekly costs: ${template.weeklyCosts}
                    </div>
                    {selectedTemplate === template.name && (
                      <div className="mt-2 flex items-center gap-1 text-primary text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Template selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={startWithTemplate}
              disabled={!selectedTemplate}
              className="flex-1"
            >
              Continue with Template
            </Button>
            <Button 
              variant="outline" 
              onClick={startCustomSetup}
              className="flex-1"
            >
              Start Setup (No Template)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (showPreview) {
    return (
      <SetupPreview
        formData={formData}
        onClose={() => setShowPreview(false)}
        onComplete={handleComplete}
        onEdit={() => setShowPreview(false)}
        saving={saving}
        mode={mode}
      />
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Business Setup</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(true)}
              className="text-xs"
            >
              Choose Template
            </Button>
            {mode === 'modal' && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{currentSection?.title}</span>
            <span>{Math.round(overallProgress)}% Complete</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          
          <div className="text-xs text-muted-foreground">
            Section {currentSectionIndex + 1} of {totalSections} • 
            Question {currentQuestionIndex + 1} of {visibleQuestions.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-20">
        {/* Section description */}
        <div className="text-sm text-muted-foreground">
          {currentSection?.description}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            value={formData[currentQuestion.id]}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            suggestion={suggestions?.[currentQuestion.id]}
            onApplySuggestion={(value) => applySuggestion(currentQuestion.id, value)}
          />
        )}

        {/* AI suggestions notice */}
        {suggestions && Object.keys(suggestions).length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">AI Suggestions Available</p>
              <p className="text-blue-700">
                Based on your load history, we've suggested some answers to save you time.
              </p>
            </div>
          </div>
        )}

        {/* Validation Summary - show when completion is less than 100% and user has interacted */}
        {overallProgress < 100 && (currentSectionIndex >= businessSetupSections.length - 1 || overallProgress > 50) && (
          <BusinessSetupValidationSummary 
            setup={formData}
            onFieldClick={(fieldId) => {
              // Navigate to the question for this field
              for (let sectionIndex = 0; sectionIndex < businessSetupSections.length; sectionIndex++) {
                const section = businessSetupSections[sectionIndex];
                const questionIndex = section.questions.findIndex(q => q.id === fieldId && shouldShowQuestion(q, formData));
                if (questionIndex !== -1) {
                  setSectionIndex(sectionIndex);
                  setQuestionIndex(questionIndex);
                  break;
                }
              }
            }}
          />
        )}
      </CardContent>

      {/* Sticky Navigation Footer */}
      <div className="sticky bottom-0 bg-card border-t p-4 rounded-b-lg z-10">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkipToEnd}
              size="sm"
            >
              Skip to Summary
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {calculateCompletionPercentage(formData) === 100 ? (
                'Review & Complete'
              ) : visibleQuestions.length === 0 ? (
                'Skip to Summary'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick progress note */}
        <div className="text-xs text-center text-muted-foreground pt-2">
          Your progress is automatically saved as you go
        </div>
      </div>
    </Card>
  );
};