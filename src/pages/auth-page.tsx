import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  // Login mutation
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      // Use external login API with correct payload
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: data.username,
          user_email: data.email,
          password: data.password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed. Please try again.');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Store token and user_id from external API in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user_id);
      // Store in global window for immediate access (extend window type)
      (window as any).menovaToken = data.token;
      (window as any).menovaUserId = data.user_id;
      toast({
        title: 'Welcome back',
        description: 'You have successfully logged in.',
      });
      navigate('/home');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      // Use external signup API with correct payload
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: data.username,
          user_email: data.email,
          password: data.password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed. Please try again.');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Store token and user_id from external API in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user_id);
      (window as any).menovaToken = data.token;
      (window as any).menovaUserId = data.user_id;
      toast({
        title: 'Account created',
        description: 'Your account has been successfully created.',
      });
      navigate('/home');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFE18B]/20 to-[#F26158]/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Form side */}
        <div className="flex flex-col justify-center">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#F26158]">
              Menova.ai
            </h1>
            <p className="text-muted-foreground mt-2">Your personal menopause companion</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Choose a password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground text-center w-full">
                {activeTab === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setActiveTab('register')}
                    >
                      Sign up
                    </Button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setActiveTab('login')}
                    >
                      Sign in
                    </Button>
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Hero side */}
        <div className="hidden md:flex flex-col justify-center">
          <div className="bg-background rounded-lg p-8 flex flex-col space-y-6 shadow-lg">
            <h2 className="text-2xl font-bold">Navigate Menopause with Confidence</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</div>
                </div>
                <div>
                  <h3 className="font-medium">Personalized Support</h3>
                  <p className="text-muted-foreground text-sm">Get advice tailored to your unique menopause journey</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</div>
                </div>
                <div>
                  <h3 className="font-medium">Track Your Symptoms</h3>
                  <p className="text-muted-foreground text-sm">Monitor patterns and identify triggers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</div>
                </div>
                <div>
                  <h3 className="font-medium">Evidence-Based Resources</h3>
                  <p className="text-muted-foreground text-sm">Access reliable information and wellness plans</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</div>
                </div>
                <div>
                  <h3 className="font-medium">Community Support</h3>
                  <p className="text-muted-foreground text-sm">Connect with others on similar journeys</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}