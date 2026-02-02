"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Registration Disabled
          </CardTitle>
          <CardDescription>
            Public registration is currently disabled for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>New accounts must be created by administrators.</strong>
            </p>
            <p>
              If you need access to Enrichify, please contact your system
              administrator to have an account created for you with appropriate
              permissions and limits.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={() => router.push("/login")} 
            className="w-full"
            variant="default"
          >
            Go to Login
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
