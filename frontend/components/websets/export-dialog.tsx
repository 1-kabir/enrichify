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
import { Download, FileSpreadsheet, Table2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api, pollExportStatus } from "@/lib/api-client";

interface ExportDialogProps {
  websetId: string;
  websetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({
  websetId,
  websetName,
  isOpen,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "xlsx" | "google-sheets">("csv");
  const [fileName, setFileName] = useState(`${websetName}-export`);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    try {
      // Initiate export
      const response = await api.post(`/export/websets/${websetId}`, {
        format: format === "google-sheets" ? "gsheet" : format,
        fileName
      });

      const exportId = response.data.id;

      // Poll for completion
      const exportResult = await pollExportStatus(exportId);

      if (exportResult.exportUrl) {
        setDownloadUrl(exportResult.exportUrl);
        setProgress(100);

        // Open download in new tab
        window.open(`${api.defaults.baseURL}${exportResult.exportUrl}`, '_blank');
      }
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
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

          {(isExporting || progress > 0) && (
            <div className="space-y-2">
              <Label>Exporting...</Label>
              <Progress value={progress} />
            </div>
          )}

          {downloadUrl && (
            <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Export completed successfully!</p>
              <a
                href={`${api.defaults.baseURL}${downloadUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 underline"
              >
                Download file <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {error && (
            <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">Export failed: {error}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Close
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
