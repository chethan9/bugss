import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal } from "lucide-react";

interface FilterMenuProps {
  repositories: string[];
  selectedRepos: string[];
  onRepoToggle: (repo: string) => void;
  allLabels: string[];
  selectedLabels: string[];
  onLabelToggle: (label: string) => void;
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  onClearFilters?: () => void;
}

export function FilterMenu({
  repositories,
  selectedRepos,
  onRepoToggle,
  allLabels,
  selectedLabels,
  onLabelToggle,
  selectedStatuses,
  onStatusToggle,
  onClearFilters,
}: FilterMenuProps) {
  const activeFilterCount = selectedRepos.length + selectedLabels.length + selectedStatuses.length;

  const statuses = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-[600px] overflow-y-auto">
        {onClearFilters && activeFilterCount > 0 && (
          <>
            <div className="px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="w-full justify-center text-xs"
              >
                Clear all filters
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Repositories Filter */}
        {repositories.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Repositories
            </DropdownMenuLabel>
            <div className="px-2 py-2 space-y-2 max-h-48 overflow-y-auto">
              {repositories.map((repo) => (
                <div key={repo} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-repo-${repo}`}
                    checked={selectedRepos.includes(repo)}
                    onCheckedChange={() => onRepoToggle(repo)}
                  />
                  <Label
                    htmlFor={`filter-repo-${repo}`}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate flex-1"
                  >
                    {repo.split("/")[1] || repo}
                  </Label>
                </div>
              ))}
            </div>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}

        {/* Status Filter */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </DropdownMenuLabel>
          <div className="px-2 py-2 space-y-2">
            {statuses.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-status-${status.value}`}
                  checked={selectedStatuses.includes(status.value)}
                  onCheckedChange={() => onStatusToggle(status.value)}
                />
                <Label
                  htmlFor={`filter-status-${status.value}`}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {status.label}
                </Label>
              </div>
            ))}
          </div>
          {allLabels.length > 0 && <DropdownMenuSeparator />}
        </DropdownMenuGroup>

        {/* Labels Filter */}
        {allLabels.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Labels
            </DropdownMenuLabel>
            <div className="px-2 py-2 space-y-2 max-h-64 overflow-y-auto">
              {allLabels.map((label) => (
                <div key={label} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-label-${label}`}
                    checked={selectedLabels.includes(label)}
                    onCheckedChange={() => onLabelToggle(label)}
                  />
                  <Label
                    htmlFor={`filter-label-${label}`}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate flex-1"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}