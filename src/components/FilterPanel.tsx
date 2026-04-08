import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, X } from "lucide-react";

interface FilterPanelProps {
  repositories: string[];
  labels: string[];
  statuses: Array<{ value: string; label: string; count: number }>;
  selectedRepos: string[];
  selectedLabels: string[];
  selectedStatuses: string[];
  searchQuery: string;
  onRepoToggle: (repo: string) => void;
  onLabelToggle: (label: string) => void;
  onStatusToggle: (status: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  repositories,
  labels,
  statuses,
  selectedRepos,
  selectedLabels,
  selectedStatuses,
  searchQuery,
  onRepoToggle,
  onLabelToggle,
  onStatusToggle,
  onSearchChange,
  onClearFilters
}: FilterPanelProps) {
  const activeFilterCount = selectedRepos.length + selectedLabels.length + selectedStatuses.length;

  return (
    <div className="w-80 bg-card border border-border rounded-lg p-6 space-y-6 h-fit sticky top-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search Issues
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2">
          {statuses.map((status) => (
            <div key={status.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status.value}`}
                checked={selectedStatuses.includes(status.value)}
                onCheckedChange={() => onStatusToggle(status.value)}
              />
              <Label
                htmlFor={`status-${status.value}`}
                className="flex-1 text-sm font-normal cursor-pointer flex items-center justify-between"
              >
                <span>{status.label}</span>
                <Badge variant="outline" className="ml-2">
                  {status.count}
                </Badge>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Repositories</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {repositories.map((repo) => (
            <div key={repo} className="flex items-center space-x-2">
              <Checkbox
                id={`repo-${repo}`}
                checked={selectedRepos.includes(repo)}
                onCheckedChange={() => onRepoToggle(repo)}
              />
              <Label
                htmlFor={`repo-${repo}`}
                className="flex-1 text-sm font-normal cursor-pointer truncate"
                title={repo}
              >
                {repo}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Labels</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {labels.map((label) => (
            <div key={label} className="flex items-center space-x-2">
              <Checkbox
                id={`label-${label}`}
                checked={selectedLabels.includes(label)}
                onCheckedChange={() => onLabelToggle(label)}
              />
              <Label
                htmlFor={`label-${label}`}
                className="flex-1 text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}