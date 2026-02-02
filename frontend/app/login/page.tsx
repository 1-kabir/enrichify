"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: "Authentication failed",
        description: err.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

      {/* Animated orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Card className="border-border/50 shadow-smooth-lg backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-2xl blur-xl opacity-50" />
                <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-smooth-lg">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-heading font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to continue to Enrichify
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 font-medium group transition-all hover:shadow-smooth"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <div className="flex items-center gap-2 text-sm text-center text-muted-foreground px-8">
                <div className="flex-1 border-t border-border" />
                <span className="px-2">Administrator access only</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <p className="text-xs text-center text-muted-foreground px-4">
                New users must be created by administrators with appropriate
                permissions
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer branding */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <span className="font-semibold text-gradient">Enrichify</span>
          </p>
        </div>
      </div>
    </div>
  );
}
