import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RateLimitExceededError } from '@/utils/apiWrapper';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useToast } from '@/hooks/use-toast';

interface RateLimitContextType {
  showUpgradeModal: boolean;
  showRateLimitBanner: boolean;
  handleRateLimitError: (error: RateLimitExceededError) => void;
  dismissBanner: () => void;
  closeModal: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRateLimitBanner, setShowRateLimitBanner] = useState(false);
  const { toast } = useToast();

  const handleRateLimitError = (error: RateLimitExceededError) => {
    // Show the upgrade modal
    setShowUpgradeModal(true);
    
    // Set banner to show after modal is dismissed
    setShowRateLimitBanner(true);
    
    // Also show a toast notification
    toast({
      title: "Daily limit reached",
      description: error.message,
      variant: "destructive",
    });
  };

  const dismissBanner = () => {
    setShowRateLimitBanner(false);
  };

  const closeModal = () => {
    setShowUpgradeModal(false);
  };

  return (
    <RateLimitContext.Provider
      value={{
        showUpgradeModal,
        showRateLimitBanner,
        handleRateLimitError,
        dismissBanner,
        closeModal,
      }}
    >
      {children}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={closeModal}
      />
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}