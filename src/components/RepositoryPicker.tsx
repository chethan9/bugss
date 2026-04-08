import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RepositoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateComplete: () => void;
}

export function RepositoryPicker({ open, onOpenChange, onUpdateComplete }: RepositoryPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onUpdateComplete();
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Repositories to Track</DialogTitle>
          <DialogDescription>
            Choose which repositories you want to monitor
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
           <p className="text-sm text-muted-foreground">Repository list will appear here once connected.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save & Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}