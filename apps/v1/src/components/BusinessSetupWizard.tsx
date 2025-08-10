import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Lightbulb, X } from 'lucide-react';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';
import { BusinessSetup, businessSetupSections, shouldShowQuestion } from '@/types/businessSetup';
import { QuestionCard } from './QuestionCard';
import { SetupPreview } from './SetupPreview';
import { useToast } from '@/components/ui/use-toast';

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
    // If setup is complete, go directly to preview
    if (getCompletionPercentage() === 100) {
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
    const success = await saveSetup(formData);
    if (success) {
      toast({
        title: "Setup Complete!",
        description: "Your business setup is saved. Load calculations will now be personalized.",
      });
      onComplete?.();
      onClose?.();
    }
  };

  const handleSkipToEnd = () => {
    setShowPreview(true);
  };

  const applySuggestion = (field: keyof BusinessSetup, value: any) => {
    handleAnswerChange(field, value);
    toast({
      title: "Suggestion Applied",
      description: "AI suggestion has been applied to your setup",
    });
  };

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
          {mode === 'modal' && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
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

      <CardContent className="space-y-6">
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
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">AI Suggestions Available</p>
              <p className="text-blue-700">
                Based on your load history, we've suggested some answers to save you time.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
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
              {getCompletionPercentage() === 100 ? (
                'Complete Setup'
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
      </CardContent>
    </Card>
  );
};