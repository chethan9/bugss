import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";

interface AuthModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const { user, error: signUpError } = await authService.signUp(email.trim(), password);
      
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      
      if (user) {
        setSuccessMessage("Account created! You can now connect GitHub.");
        setTimeout(() => {
          setEmail("");
          setPassword("");
          setIsLoading(false);
          onOpenChange?.(false);
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const { user, error: signInError } = await authService.signIn(email.trim(), password);
      
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      
      if (user) {
        setEmail("");
        setPassword("");
        setIsLoading(false);
        onOpenChange?.(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Welcome to GitHub Dashboard</DialogTitle>
          <DialogDescription>
            Sign in or create an account to connect your GitHub repositories
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input 
                  id="signin-email" 
                  type="email" 
                  placeholder="you@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input 
                  id="signin-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <Button 
                onClick={handleSignIn} 
                disabled={isLoading || !email.trim() || !password.trim()} 
                className="w-full gap-2"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="you@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
              <Button 
                onClick={handleSignUp} 
                disabled={isLoading || !email.trim() || !password.trim()} 
                className="w-full gap-2"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}