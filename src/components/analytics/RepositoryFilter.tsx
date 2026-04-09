import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FolderGit2 } from "lucide-react";

interface RepositoryFilterProps {
  repositories: string[];
  activeRepositories: string[];
  onToggle: (repo: string) => void;
  issueCounts: Record<string, number>;
}

export function RepositoryFilter({ 
  repositories, 
  activeRepositories, 
  onToggle,
  issueCounts 
}: RepositoryFilterProps) {
  const allActive = activeRepositories.length === 0 || activeRepositories.length === repositories.length;
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <FolderGit2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Repository Filter</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {allActive ? "All" : `${activeRepositories.length}/${repositories.length}`}
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {repositories.map((repo) => {
          const isActive = activeRepositories.length === 0 || activeRepositories.includes(repo);
          const repoName = repo.split("/")[1] || repo;
          const count = issueCounts[repo] || 0;
          
          return (
            <div 
              key={repo}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Switch
                  checked={isActive}
                  onCheckedChange={() => onToggle(repo)}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={repo}>
                    {repoName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {repo.split("/")[0]}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs ml-2">
                {count}
              </Badge>
            </div>
          );
        })}
      </div>
      
      {repositories.length > 1 && (
        <div className="mt-3 pt-3 border-t flex gap-2">
          <button
            onClick={() => {
              // Select all - clear filter (shows all)
              repositories.forEach(repo => {
                if (!activeRepositories.includes(repo) && activeRepositories.length > 0) {
                  onToggle(repo);
                }
              });
              // If some are selected, clear all to show all
              if (activeRepositories.length > 0 && activeRepositories.length < repositories.length) {
                activeRepositories.forEach(repo => onToggle(repo));
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            Show All
          </button>
        </div>
      )}
    </Card>
  );
}