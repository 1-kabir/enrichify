"use client";

import { useState } from "react";
import type { EnrichCellDto } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

interface EnrichmentDialogProps {
  websetId: string;
  columnName: string;
  selectedRows: number[];
  llmProviderId?: string;
  searchProviderId?: string;
  isOpen: boolean;
  onClose: () => void;
  onEnrich: (dto: EnrichCellDto) => void;
}

export function EnrichmentDialog({
  websetId,
  columnName,
  selectedRows,
  llmProviderId,
  searchProviderId,
  isOpen,
  onClose,
  onEnrich,
}: EnrichmentDialogProps) {
  const [prompt, setPrompt] = useState("");

  const handleEnrich = () => {
    onEnrich({
      websetId,
      column: columnName,
      rows: selectedRows,
      prompt: prompt || undefined,
      llmProviderId,
      searchProviderId:
        searchProviderId === "none" ? undefined : searchProviderId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enrich Column
          </DialogTitle>
          <DialogDescription>
            Enriching {selectedRows.length} row(s) in column &quot;{columnName}
            &quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Enrichment Prompt (Optional)</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Find the CEO's email address"
            />
            <p className="text-xs text-muted-foreground">
              Provide specific instructions for the enrichment. Leave empty for
              default behavior.
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
            <p>
              <strong>Rows:</strong> {selectedRows.length}
            </p>
            <p>
              <strong>Column:</strong> {columnName}
            </p>
            {llmProviderId && (
              <p>
                <strong>LLM:</strong> Selected
              </p>
            )}
            {searchProviderId && searchProviderId !== "none" && (
              <p>
                <strong>Search:</strong> Enabled
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleEnrich}>
            <Sparkles className="mr-2 h-4 w-4" />
            Start Enrichment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
