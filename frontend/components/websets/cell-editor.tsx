"use client";

import { useState } from "react";
import type { WebsetCell } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CitationViewer } from "./citation-viewer";
import { FileText } from "lucide-react";

interface CellEditorProps {
  cell: WebsetCell | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string, confidenceScore?: number) => void;
}

export function CellEditor({ cell, isOpen, onClose, onSave }: CellEditorProps) {
  const [value, setValue] = useState(cell?.value || "");
  const [confidenceScore, setConfidenceScore] = useState(
    cell?.confidenceScore || 1.0,
  );
  const [showCitations, setShowCitations] = useState(false);

  const handleSave = () => {
    onSave(value, confidenceScore);
    onClose();
  };

  if (!cell) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Cell - Row {cell.row}, Column {cell.column}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter cell value..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence">
                Confidence Score ({(confidenceScore * 100).toFixed(0)}%)
              </Label>
              <input
                type="range"
                id="confidence"
                min="0"
                max="1"
                step="0.01"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            {cell.citations && cell.citations.length > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {cell.citations.length} citation(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCitations(true)}
                >
                  View
                </Button>
              </div>
            )}
            {cell.metadata && (
              <div className="space-y-2">
                <Label>Metadata</Label>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(cell.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {cell.citations && (
        <CitationViewer
          citations={cell.citations}
          isOpen={showCitations}
          onClose={() => setShowCitations(false)}
        />
      )}
    </>
  );
}
