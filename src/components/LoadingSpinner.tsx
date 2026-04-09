import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  subtext?: string;
  className?: string;
  variant?: "default" | "dots" | "pulse" | "orbit";
}

export function LoadingSpinner({ 
  size = "lg", 
  text, 
  subtext,
  className,
  variant = "orbit"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-primary",
                size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-5 h-5"
              )}
              style={{
                animation: "bounce 1.4s infinite ease-in-out both",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        {text && (
          <div className="text-center">
            <p className={cn("font-medium text-foreground", textSizeClasses[size])}>{text}</p>
            {subtext && <p className="text-sm text-muted-foreground mt-1">{subtext}</p>}
          </div>
        )}
        <style jsx>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
        <div className="relative">
          <div className={cn(sizeClasses[size], "rounded-full bg-primary/20 animate-ping absolute")} />
          <div className={cn(sizeClasses[size], "rounded-full bg-primary/40 animate-pulse")} />
        </div>
        {text && (
          <div className="text-center">
            <p className={cn("font-medium text-foreground", textSizeClasses[size])}>{text}</p>
            {subtext && <p className="text-sm text-muted-foreground mt-1">{subtext}</p>}
          </div>
        )}
      </div>
    );
  }

  // Default: Orbit variant - beautiful orbital animation
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          style={{ animation: "spin 3s linear infinite" }}
        />
        
        {/* Middle ring */}
        <div 
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary border-r-primary/50"
          style={{ animation: "spin 2s linear infinite reverse" }}
        />
        
        {/* Inner ring */}
        <div 
          className="absolute inset-4 rounded-full border-2 border-transparent border-b-accent border-l-accent/50"
          style={{ animation: "spin 1.5s linear infinite" }}
        />
        
        {/* Center dot */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
        >
          <div 
            className="w-2 h-2 rounded-full bg-primary"
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
        </div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ 
              animation: `spin ${2 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            <div 
              className={cn(
                "absolute rounded-full bg-primary",
                size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
              )}
              style={{ 
                top: "0%", 
                left: "50%", 
                transform: "translateX(-50%)",
                opacity: 1 - i * 0.25
              }}
            />
          </div>
        ))}
      </div>
      
      {text && (
        <div className="text-center">
          <p className={cn("font-semibold text-foreground", textSizeClasses[size])}>{text}</p>
          {subtext && (
            <p className="text-sm text-muted-foreground mt-1 animate-pulse">{subtext}</p>
          )}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

// Full page loader with background
export function FullPageLoader({ 
  text = "Loading...", 
  subtext,
  variant = "orbit"
}: { 
  text?: string; 
  subtext?: string;
  variant?: "default" | "dots" | "pulse" | "orbit";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" text={text} subtext={subtext} variant={variant} />
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="w-16 h-5 rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="w-12 h-8 rounded bg-muted" />
            <div className="w-24 h-4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-muted rounded flex-1 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div 
                key={j} 
                className="h-4 bg-muted rounded flex-1 animate-pulse"
                style={{ animationDelay: `${(i + j) * 0.1}s` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Data fetching loader with progress feel
export function DataFetchingLoader({ 
  repoCount = 0,
  currentRepo = ""
}: { 
  repoCount?: number;
  currentRepo?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-20 h-20">
        {/* Background circle */}
        <svg className="w-20 h-20" viewBox="0 0 100 100">
          <circle
            className="text-muted stroke-current"
            strokeWidth="8"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary stroke-current"
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: "264",
              strokeDashoffset: "66",
              animation: "dash 1.5s ease-in-out infinite",
              transformOrigin: "center",
            }}
          />
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-primary animate-pulse" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          Fetching Issues
        </p>
        {repoCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Loading from {repoCount} {repoCount === 1 ? "repository" : "repositories"}
          </p>
        )}
        {currentRepo && (
          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {currentRepo}
          </p>
        )}
      </div>
      
      {/* Animated progress bar */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
          style={{
            width: "30%",
            animation: "progress 2s ease-in-out infinite",
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 264;
            transform: rotate(0deg);
          }
          50% {
            stroke-dashoffset: 66;
          }
          100% {
            stroke-dashoffset: 264;
            transform: rotate(360deg);
          }
        }
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}