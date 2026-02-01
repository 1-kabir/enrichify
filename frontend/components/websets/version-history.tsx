"use client";

import type { WebsetVersion } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/react-scroll-area";
import { History, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface VersionHistoryProps {
  versions: WebsetVersion[];
  currentVersion: number;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  isOpen,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this webset
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Version {version.version}</h4>
                      {version.version === currentVersion && (
                        <Badge variant="success">Current</Badge>
                      )}
                    </div>
                    {version.changeDescription && (
                      <p className="text-sm text-muted-foreground">
                        {version.changeDescription}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {version.version !== currentVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(version.id)}
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Restore
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            {versions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No version history available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
