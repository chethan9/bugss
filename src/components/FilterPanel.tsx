import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterPanelProps {
  repositories: string[];
  selectedRepos: string[];
  onRepoToggle: (repo: string) => void;
  allLabels: string[];
  selectedLabels: string[];
  onLabelToggle: (label: string) => void;
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters?: () => void;
}

export function FilterPanel({
  repositories,
  selectedRepos,
  onRepoToggle,
  allLabels,
  selectedLabels,
  onLabelToggle,
  selectedStatuses,
  onStatusToggle,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: FilterPanelProps) {
  const statuses = [
    { value: "open", label: "Open", color: "bg-green-100 text-green-800 border-green-300" },
    { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800 border-gray-300" },
  ];

  return (
    <Card className="p-6 space-y-6 bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-lg">Filters</h3>
          {onClearFilters && (
            <button 
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search Issues
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Search by title or number..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Repositories Filter */}
        {repositories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Repositories</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {repositories.map((repo) => (
                <div key={repo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`repo-${repo}`}
                    checked={selectedRepos.includes(repo)}
                    onCheckedChange={() => onRepoToggle(repo)}
                  />
                  <label
                    htmlFor={`repo-${repo}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate flex-1"
                  >
                    {repo.split("/")[1] || repo}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Badge
                key={status.value}
                variant={selectedStatuses.includes(status.value) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedStatuses.includes(status.value)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => onStatusToggle(status.value)}
              >
                {status.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Labels Filter */}
        {allLabels.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Labels</Label>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {allLabels.map((label) => (
                <Badge
                  key={label}
                  variant={selectedLabels.includes(label) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedLabels.includes(label)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => onLabelToggle(label)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}