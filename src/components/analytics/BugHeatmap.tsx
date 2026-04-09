import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { HeatmapDataPoint } from "@/services/analyticsService";

interface BugHeatmapProps {
  data: HeatmapDataPoint[];
}

export function BugHeatmap({ data }: BugHeatmapProps) {
  // Get unique modules and dates
  const modules = Array.from(new Set(data.map(d => d.module)));
  const dates = Array.from(new Set(data.map(d => d.date))).sort();
  
  // Get max count for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(`${d.date}-${d.module}`, d.count);
  });
  
  // Get color intensity based on count
  const getColorIntensity = (count: number) => {
    const intensity = Math.min((count / maxCount) * 100, 100);
    if (count === 0) return "bg-gray-100";
    if (intensity < 20) return "bg-red-100";
    if (intensity < 40) return "bg-red-200";
    if (intensity < 60) return "bg-red-300";
    if (intensity < 80) return "bg-red-400";
    return "bg-red-500";
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Bug Heatmap</h3>
      </div>
      
      <div className="overflow-x-auto">
        <TooltipProvider>
          <div className="inline-block min-w-full">
            <div className="flex">
              {/* Module labels (left) */}
              <div className="flex flex-col gap-1 pr-2">
                <div className="h-6" /> {/* Spacer for date header */}
                {modules.map(module => (
                  <div key={module} className="h-6 text-xs text-muted-foreground flex items-center">
                    {module.slice(0, 12)}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex flex-col gap-1">
                {/* Date headers */}
                <div className="flex gap-1">
                  {dates.slice(-14).map(date => (
                    <div key={date} className="w-6 h-6 text-[10px] text-muted-foreground flex items-center justify-center">
                      {new Date(date).getDate()}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap cells */}
                {modules.map(module => (
                  <div key={module} className="flex gap-1">
                    {dates.slice(-14).map(date => {
                      const count = dataMap.get(`${date}-${module}`) || 0;
                      return (
                        <Tooltip key={`${date}-${module}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-6 h-6 rounded ${getColorIntensity(count)} cursor-pointer transition-transform hover:scale-110`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-semibold">{module}</p>
                              <p className="text-muted-foreground">{date}</p>
                              <p className="text-primary">{count} bug{count !== 1 ? "s" : ""}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-200 rounded" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-400 rounded" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>High</span>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-muted-foreground">
        Visualizes bug concentration across modules over time. Dark cells indicate high activity - use this to identify spike patterns and problematic modules.
      </p>
    </Card>
  );
}