"use client";

import { cn } from "@/lib/utils";
import type { WebsetCell } from "@/types/webset";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WebsetCellComponentProps {
  cell: WebsetCell | null;
  onEdit: () => void;
  isEditing?: boolean;
}

function getConfidenceColor(score?: number): string {
  if (!score) return "bg-gray-100 dark:bg-gray-800";
  if (score >= 0.8)
    return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
  if (score >= 0.6)
    return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
  return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
}

function getConfidenceBadgeVariant(
  score?: number,
): "success" | "warning" | "destructive" | "secondary" {
  if (!score) return "secondary";
  if (score >= 0.8) return "success";
  if (score >= 0.6) return "warning";
  return "destructive";
}

export function WebsetCellComponent({
  cell,
  onEdit,
  isEditing,
}: WebsetCellComponentProps) {
  const value = cell?.value || "";
  const confidenceScore = cell?.confidenceScore;
  const hasCitations = cell?.citations && cell.citations.length > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "group relative p-2 min-h-[60px] border rounded-md cursor-pointer transition-all",
              getConfidenceColor(confidenceScore),
              isEditing && "ring-2 ring-primary",
            )}
            onClick={onEdit}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm flex-1 break-words">
                {value || (
                  <span className="text-muted-foreground italic">Empty</span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {hasCitations && (
                  <Badge variant="secondary" className="h-5 px-1">
                    <FileText className="h-3 w-3" />
                  </Badge>
                )}
                {confidenceScore !== undefined && confidenceScore < 0.8 && (
                  <Badge
                    variant={getConfidenceBadgeVariant(confidenceScore)}
                    className="h-5 px-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>
            {confidenceScore !== undefined && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-md overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidenceScore * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-full",
                    confidenceScore >= 0.8
                      ? "bg-green-500"
                      : confidenceScore >= 0.6
                        ? "bg-yellow-500"
                        : "bg-red-500",
                  )}
                />
              </div>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {confidenceScore !== undefined && (
              <p>Confidence: {(confidenceScore * 100).toFixed(0)}%</p>
            )}
            {hasCitations && <p>{cell.citations!.length} citation(s)</p>}
            {cell?.updatedAt && (
              <p className="text-muted-foreground">
                Updated: {new Date(cell.updatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
