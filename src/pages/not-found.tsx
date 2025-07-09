import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFE18B]/30 to-[#F26158]/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-center text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/home')} className="mr-2">
            Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}