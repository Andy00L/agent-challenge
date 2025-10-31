"use client";

import { Button } from "./ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

interface ResetWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClear: () => void;
}

export function ResetWarningModal({
  open,
  onOpenChange,
  onClear,
}: ResetWarningModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Everything?</DialogTitle>
          <DialogDescription>
            This will clear the current conversation and reset the diagram. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onClear}>
            Clear Everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
