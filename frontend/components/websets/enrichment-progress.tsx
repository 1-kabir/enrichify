"use client";

import type { EnrichmentJob } from "@/types/webset";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface EnrichmentProgressProps {
  jobs: EnrichmentJob[];
}

const statusIcons = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: "secondary",
  running: "default",
  completed: "success",
  failed: "destructive",
} as const;

export function EnrichmentProgress({ jobs }: EnrichmentProgressProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrichment Jobs</CardTitle>
        <CardDescription>Track your ongoing enrichment tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => {
          const StatusIcon = statusIcons[job.status];
          const progress =
            job.totalRows > 0 ? (job.completedRows / job.totalRows) * 100 : 0;

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">
                      Column: {job.column}
                    </h4>
                    <Badge variant={statusColors[job.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.completedRows} of {job.totalRows} rows completed
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
