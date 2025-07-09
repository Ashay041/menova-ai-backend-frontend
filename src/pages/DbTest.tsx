import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import DatabaseConnectionTest from '../components/DatabaseConnectionTest';

export default function DbTestPage() {
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const testUserAPI = async () => {
    setIsCheckingAPI(true);
    setApiResponse(null);
    setApiError(null);
    
    try {
      const response = await fetch('/api/wellness-plans');
      const data = await response.json();
      
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('API test error:', error);
      setApiError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCheckingAPI(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Database Connection Diagnostics</h1>
        
        <div className="grid gap-6">
          <DatabaseConnectionTest />
          
          <Separator className="my-4" />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                API Data Test
              </CardTitle>
              <CardDescription>
                Test data retrieval from the wellness plans API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiResponse && (
                <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-96 dark:bg-gray-800">
                  {apiResponse}
                </pre>
              )}
              {apiError && (
                <div className="text-red-500 p-2 bg-red-50 rounded dark:bg-red-950/20">
                  <p className="font-medium">Error:</p>
                  <p>{apiError}</p>
                </div>
              )}
              {!apiResponse && !apiError && !isCheckingAPI && (
                <p className="text-muted-foreground">Click the button below to test the API endpoint.</p>
              )}
              {isCheckingAPI && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testUserAPI}
                disabled={isCheckingAPI}
              >
                {isCheckingAPI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Wellness Plans API'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}