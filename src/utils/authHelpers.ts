import { supabase } from '@loadmaster/api';
import { logError } from '@/utils/errorLogger';

/**
 * Utility to handle JWT token refresh with retry logic
 * @param error - The error to check for JWT expiration
 * @returns boolean - true if this was a JWT expiration error
 */
export function isJWTExpiredError(error: any): boolean {
  return error?.message?.includes('JWT expired') || 
         error?.message?.includes('PGRST303') ||
         error?.code === 'PGRST303';
}

/**
 * Attempts to refresh the session token
 * @returns Promise<boolean> - true if refresh was successful
 */
export async function refreshAuthSession(): Promise<boolean> {
  try {
    console.log('🔄 Attempting to refresh authentication session...');
    
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Failed to refresh session:', error);
      logError('Failed to refresh session:', error);
      return false;
    }
    
    console.log('✅ Session refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception during session refresh:', error);
    logError('Exception during session refresh:', error);
    return false;
  }
}

/**
 * Helper function to handle database operations with JWT refresh retry
 * @param operation - The database operation to execute
 * @param retryCount - Current retry count (internal use)
 * @param maxRetries - Maximum number of retries (default: 2)
 * @returns Promise<T> - Result of the operation
 */
export async function withJWTRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0,
  maxRetries = 2
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (isJWTExpiredError(error) && retryCount < maxRetries) {
      console.log(`🔄 JWT expired (attempt ${retryCount + 1}/${maxRetries + 1}), refreshing...`);
      
      const refreshSuccess = await refreshAuthSession();
      
      if (refreshSuccess) {
        console.log('✅ Retrying operation after successful token refresh...');
        return withJWTRetry(operation, retryCount + 1, maxRetries);
      } else {
        console.error('❌ Failed to refresh token, giving up');
        throw new Error('Authentication expired. Please sign in again.');
      }
    }
    
    // If not a JWT error or max retries exceeded, re-throw the original error
    throw error;
  }
}