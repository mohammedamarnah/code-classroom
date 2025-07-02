import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Code, Mail, User, Lock } from "lucide-react";
import { emailSignupSchema, type EmailSignup } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(false);

  const form = useForm<EmailSignup & LoginData>({
    resolver: zodResolver(isLogin ? loginSchema : emailSignupSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: EmailSignup) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Account created!",
        description: "Welcome to CodeClassroom",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailSignup & LoginData) => {
    if (isLogin) {
      loginMutation.mutate({
        email: data.email,
        password: data.password,
      });
    } else {
      signupMutation.mutate({
        firstName: data.firstName,
        email: data.email,
        password: data.password,
      });
    }
  };

  const handleModeToggle = () => {
    setIsLogin(!isLogin);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Code className="text-primary text-2xl" />
              <h1 className="text-2xl font-bold">CodeClassroom</h1>
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Enter your email and password to sign in" 
                : "Enter your details to get started with CodeClassroom"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Enter your name" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signupMutation.isPending || loginMutation.isPending}
                >
                  {(signupMutation.isPending || loginMutation.isPending) && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.location.href = '/api/login'}
              >
                Sign in with Replit
              </Button>
            </div>
            
            <div className="mt-6 text-center text-sm">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleModeToggle}
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right side - Hero */}
        <div className="hidden lg:block space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Learn Java Programming
              <span className="text-primary block">The Interactive Way</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg">
              Join thousands of students mastering Java through hands-on coding challenges, 
              real-time feedback, and gamified learning.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 max-w-lg">
            <div className="flex items-start space-x-3 p-4 bg-background/50 rounded-lg border">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Interactive Code Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Write and test Java code with syntax highlighting and auto-completion
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-background/50 rounded-lg border">
              <div className="bg-primary/10 p-2 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Classroom Management</h3>
                <p className="text-sm text-muted-foreground">
                  Teachers can create assignments and track student progress
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-background/50 rounded-lg border">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Instant Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Get immediate results and detailed explanations for your code
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}