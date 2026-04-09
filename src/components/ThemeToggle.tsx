import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 relative overflow-hidden"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Sun 
        className={`h-4 w-4 absolute transition-all duration-300 ${
          isDark 
            ? "rotate-90 scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100"
        }`} 
      />
      <Moon 
        className={`h-4 w-4 absolute transition-all duration-300 ${
          isDark 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0"
        }`} 
      />
    </Button>
  );
}