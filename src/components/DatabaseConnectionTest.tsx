import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DatabaseConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking database connection...');
  const [details, setDetails] = useState<string>('');

  const checkConnection = async () => {
    setStatus('loading');
    setMessage('Checking database connection...');
    setDetails('');
    
    try {
      const response = await fetch('/api/healthcheck');
      const data = await response.json();
      
      console.log('Health check response:', data);
      
      if (data.database === 'connected') {
        setStatus('connected');
        setMessage('Database connection successful!');
        setDetails(JSON.stringify(data, null, 2));
      } else {
        setStatus('error');
        setMessage('Database connection failed');
        setDetails(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Health check error:', error);
      setStatus('error');
      setMessage('Failed to check database connection');
      setDetails(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {status === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          Database Connection Status
        </CardTitle>
        <CardDescription>
          Testing connectivity to MongoDB Atlas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium mb-2">{message}</p>
        {details && (
          <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-48 dark:bg-gray-800">
            {details}
          </pre>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkConnection}
          disabled={status === 'loading'}
          variant={status === 'connected' ? 'outline' : 'default'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection Again'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}