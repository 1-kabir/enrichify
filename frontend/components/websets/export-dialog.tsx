"use client";

import { useState } from "react";
import type { ExportFormat } from "@/types/webset";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Table2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ExportDialogProps {
  websetName: string;
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

export function ExportDialog({
  websetName,
  isOpen,
  onClose,
  onExport,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "xlsx" | "google-sheets">("csv");
  const [fileName, setFileName] = useState(`${websetName}-export`);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onExport({ type: format, fileName });
      setProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        onClose();
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setIsExporting(false);
      setProgress(0);
    }
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    xlsx: Table2,
    "google-sheets": FileSpreadsheet,
  };

  const FormatIcon = formatIcons[format];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Webset
          </DialogTitle>
          <DialogDescription>
            Choose your export format and download options
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as "csv" | "xlsx" | "google-sheets")}
              disabled={isExporting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="google-sheets">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Google Sheets
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="export-file-name"
              disabled={isExporting}
            />
          </div>

          {isExporting && (
            <div className="space-y-2">
              <Label>Exporting...</Label>
              <Progress value={progress} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <FormatIcon className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
