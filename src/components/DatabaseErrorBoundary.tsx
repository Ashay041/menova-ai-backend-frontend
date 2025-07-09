import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DatabaseErrorBoundaryProps {
  children: ReactNode;
}

export default function DatabaseErrorBoundary({ children }: DatabaseErrorBoundaryProps) {
  const [databaseError, setDatabaseError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // This effect intercepts fetch responses to detect database connection errors
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // If response status is 503 (service unavailable), it's likely a DB connection issue
        if (response.status === 503) {
          const data = await response.clone().json();
          if (data.error === 'Database Unavailable') {
            setDatabaseError(true);
            setErrorMessage(data.message || 'The database is currently unavailable. Please try again later.');
          }
        }
        
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        return Promise.reject(error);
      }
    };
    
    // Restore original fetch on cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const retryConnection = () => {
    // Make a simple API call to test connection
    fetch('/api/wellness-plans')
      .then(response => {
        if (response.ok) {
          setDatabaseError(false);
          setErrorMessage('');
        } else if (response.status === 503) {
          response.json().then(data => {
            setErrorMessage(data.message || 'The database is still unavailable. Please try again later.');
          });
        }
      })
      .catch(error => {
        console.error('Connection test error:', error);
        setErrorMessage('Could not connect to the server. Please check your internet connection.');
      });
  };

  if (databaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              We're experiencing technical difficulties connecting to our database. 
              This is usually temporary and might be resolved by trying again.
            </p>
            
            <Button onClick={retryConnection}>
              Retry Connection
            </Button>
            
            <p className="text-xs text-muted-foreground">
              If the problem persists, please contact support or try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}