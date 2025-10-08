import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/errorLogger';

/**
 * SessionMonitor component - monitors authentication session health
 * and provides user feedback for authentication issues
 */
export function SessionMonitor() {
  const { user, session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !session) return;

    // Check if the current session is close to expiring
    const checkSessionExpiry = () => {
      if (session.expires_at) {
        const expiryTime = session.expires_at * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // Warn if less than 10 minutes remaining
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('⚠️ Session expires soon, will auto-refresh');
          
          // Preemptively refresh the session
          supabase.auth.refreshSession().catch((error) => {
            logError('Preemptive session refresh failed:', error);
          });
        }
      }
    };

    // Check session expiry every 5 minutes
    const intervalId = setInterval(checkSessionExpiry, 5 * 60 * 1000);
    
    // Initial check
    checkSessionExpiry();

    return () => clearInterval(intervalId);
  }, [user, session, toast]);

  // Listen for auth events and provide user feedback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'TOKEN_REFRESHED':
            console.log('✅ Authentication token refreshed automatically');
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            break;
            
          case 'SIGNED_IN':
            console.log('👋 User signed in');
            break;
            
          default:
            console.log(`🔐 Auth event: ${event}`);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  // This component doesn't render anything visible
  return null;
}