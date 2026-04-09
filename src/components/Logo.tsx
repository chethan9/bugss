import { Bug } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  appName?: string;
  logoUrl?: string | null;
}

export function Logo({ 
  className = "", 
  showText = true, 
  size = "md",
  appName = "FixFlix",
  logoUrl = null
}: LogoProps) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-lg", container: "gap-1.5", img: "h-7 w-7" },
    md: { icon: "h-6 w-6", text: "text-xl", container: "gap-2", img: "h-8 w-8" },
    lg: { icon: "h-8 w-8", text: "text-2xl", container: "gap-2.5", img: "h-10 w-10" },
  };

  const { icon, text, container, img } = sizes[size];

  // Split app name for two-tone effect (first word normal, rest primary)
  const nameParts = appName.split(/(?=[A-Z])/);
  const firstPart = nameParts[0] || appName;
  const secondPart = nameParts.slice(1).join("") || "";

  return (
    <div className={`flex items-center ${container} ${className}`}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={appName} 
          className={`${img} object-contain rounded-lg`}
        />
      ) : (
        <div className="relative flex-shrink-0">
          <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-lg">
            <Bug className={`${icon} text-white`} />
          </div>
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
      )}
      {showText && (
        <span className={`font-bold ${text} tracking-tight whitespace-nowrap`}>
          <span className="text-foreground">{firstPart}</span>
          {secondPart && <span className="text-primary">{secondPart}</span>}
        </span>
      )}
    </div>
  );
}