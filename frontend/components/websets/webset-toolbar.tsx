"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Share2,
  History,
  MoreHorizontal,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Upload
} from "lucide-react";
import { FileUploadDialog } from "./file-upload-dialog";

interface WebsetToolbarProps {
  onExport: () => void;
  onShare: () => void;
  onVersionHistory: () => void;
  onEnrich: () => void;
  onAddRow: () => void;
  onDeleteRows?: () => void;
  onDuplicate?: () => void;
  hasSelectedRows?: boolean;
}

export function WebsetToolbar({
  onExport,
  onShare,
  onVersionHistory,
  onEnrich,
  onAddRow,
  onDeleteRows,
  onDuplicate,
  hasSelectedRows = false,
}: WebsetToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <FileUploadDialog />
        <Button onClick={onAddRow} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
        <Button onClick={onEnrich} variant="default" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Enrich
        </Button>
        <Separator orientation="vertical" className="h-6" />
        {hasSelectedRows && (
          <>
            {onDeleteRows && (
              <Button onClick={onDeleteRows} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            {onDuplicate && (
              <Button onClick={onDuplicate} variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            )}
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={onVersionHistory} variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Webset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
