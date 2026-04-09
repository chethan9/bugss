import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

export type DateRange = {
  from: Date;
  to: Date;
};

interface DateRangeFilterProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "All time", days: null },
  ];

  const handlePreset = (days: number | null) => {
    if (days === null) {
      onDateRangeChange(null);
    } else {
      onDateRangeChange({
        from: subDays(new Date(), days),
        to: new Date(),
      });
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!dateRange) return "All time";
    return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {getDisplayText()}
          {dateRange && (
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
              Filtered
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Quick Select</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset(preset.days)}
                  className="justify-start"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}