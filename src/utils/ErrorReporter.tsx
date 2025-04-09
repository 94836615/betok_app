/**
 * Error reporting and handling utility
 */

// Track errors for debugging
const errors: Array<{
  timestamp: number;
  message: string;
  stack?: string;
  metadata?: any;
}> = [];

const MAX_ERRORS = 20;

/**
 * Report an error that occurred in the app
 */
export const reportError = (error: Error | string, metadata?: any): void => {
  const errorObj = {
    timestamp: Date.now(),
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    metadata,
  };
  
  console.error('[ErrorReporter]', errorObj);
  
  // Add to errors array, limiting size
  errors.unshift(errorObj);
  if (errors.length > MAX_ERRORS) {
    errors.pop();
  }
  
  // Could send to a remote error reporting service here
};

/**
 * Get list of recent errors
 */
export const getRecentErrors = () => {
  return [...errors];
};

/**
 * Clear error log
 */
export const clearErrors = () => {
  errors.length = 0;
};

/**
 * Create error boundary handler for React components
 */
export const withErrorBoundary = (Component: React.ComponentType<any>) => {
  return class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      reportError(error, { componentStack: errorInfo.componentStack });
    }

    render() {
      if (this.state.hasError) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Something went wrong.</Text>
            <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
              <Text>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Import missing dependencies for ErrorBoundary
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default {
  reportError,
  getRecentErrors,
  clearErrors,
  withErrorBoundary,
};
