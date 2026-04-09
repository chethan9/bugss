import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const statuses = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
  ];

  const activeFiltersCount = selectedRepos.length + selectedLabels.length + selectedStatuses.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Filters</DropdownMenuLabel>
          {activeFiltersCount > 0 && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto px-2 py-1 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Repositories */}
        {repositories.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Repositories
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              {repositories.map((repo) => (
                <DropdownMenuCheckboxItem
                  key={repo}
                  checked={selectedRepos.includes(repo)}
                  onCheckedChange={() => onRepoToggle(repo)}
                  className="text-sm"
                >
                  {repo}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Status */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Status
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          {statuses.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.value}
              checked={selectedStatuses.includes(status.value)}
              onCheckedChange={() => onStatusToggle(status.value)}
              className="text-sm"
            >
              {status.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>

        {/* Labels */}
        {allLabels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Labels
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              {allLabels.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label}
                  checked={selectedLabels.includes(label)}
                  onCheckedChange={() => onLabelToggle(label)}
                  className="text-sm"
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}