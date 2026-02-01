"use client";

import type { WebsetCitation } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CitationViewerProps {
  citations: WebsetCitation[];
  isOpen: boolean;
  onClose: () => void;
}

export function CitationViewer({
  citations,
  isOpen,
  onClose,
}: CitationViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Citations ({citations.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {citations.map((citation) => (
            <div
              key={citation.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium text-sm">
                    {citation.title || "Untitled"}
                  </h4>
                  {citation.contentSnippet && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {citation.contentSnippet}
                    </p>
                  )}
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {citation.url}
                  </a>
                </div>
              </div>
              {citation.searchProviderId && (
                <Badge variant="secondary" className="mt-2">
                  Source
                </Badge>
              )}
            </div>
          ))}
          {citations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No citations available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
