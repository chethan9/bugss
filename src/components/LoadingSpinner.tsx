import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img 
        src="/Ripple_1x-1.0s-200px-200px.svg" 
        alt="Loading..." 
        className={cn(sizeClasses[size])}
      />
    </div>
  );
}

interface DataFetchingLoaderProps {
  repoCount?: number;
  message?: string;
}

export function DataFetchingLoader({ repoCount = 1, message }: DataFetchingLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative mb-8">
        <img 
          src="/Ripple_1x-1.0s-200px-200px.svg" 
          alt="Loading..." 
          className="w-32 h-32"
        />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">
        {message || "Fetching Issues..."}
      </h2>
      <p className="text-muted-foreground mb-6">
        Analyzing {repoCount} {repoCount === 1 ? "repository" : "repositories"}
      </p>
      
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Connecting to GitHub API</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted animate-pulse" />
          <span>Fetching issue data</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted animate-pulse" />
          <span>Calculating analytics</span>
        </div>
      </div>
    </div>
  );
}