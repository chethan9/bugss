import { Bug } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-lg", container: "gap-1.5" },
    md: { icon: "h-6 w-6", text: "text-xl", container: "gap-2" },
    lg: { icon: "h-8 w-8", text: "text-2xl", container: "gap-2.5" },
  };

  const { icon, text, container } = sizes[size];

  return (
    <div className={`flex items-center ${container} ${className}`}>
      <div className="relative">
        {/* Bug icon with gradient background */}
        <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-lg">
          <Bug className={`${icon} text-white`} />
        </div>
        {/* Small checkmark indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
          <svg 
            className="h-2 w-2 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${text} tracking-tight`}>
          <span className="text-foreground">Fix</span>
          <span className="text-primary">Flix</span>
        </span>
      )}
    </div>
  );
}