"use client";

import type { EnrichmentJob } from "@/types/webset";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Clock, Pause, Play, Square } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface EnrichmentProgressProps {
  jobs: EnrichmentJob[];
  onJobUpdate?: () => void; // Callback to refresh job status after control actions
}

export function EnrichmentProgress({ jobs, onJobUpdate }: EnrichmentProgressProps) {
  const { toast } = useToast();

  if (jobs.length === 0) {
    return null;
  }

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      switch (action) {
        case 'pause':
          await api.post(`/enrichment/jobs/${jobId}/pause`);
          toast({
            title: "Job Paused",
            description: "The enrichment job has been paused successfully.",
          });
          break;
        case 'resume':
          await api.post(`/enrichment/jobs/${jobId}/resume`);
          toast({
            title: "Job Resumed",
            description: "The enrichment job has been resumed successfully.",
          });
          break;
        case 'stop':
          await api.post(`/enrichment/jobs/${jobId}/stop`);
          toast({
            title: "Job Stopped",
            description: "The enrichment job has been stopped successfully.",
          });
          break;
      }

      // Refresh job status if callback is provided
      if (onJobUpdate) {
        onJobUpdate();
      }
    } catch (error) {
      console.error(`Failed to ${action} job:`, error);
      toast({
        title: "Action Failed",
        description: `Could not ${action} the job. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'running': return Loader2;
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "secondary";
      case 'running': return "default";
      case 'completed': return "success";
      case 'failed': return "destructive";
      default: return "secondary";
    }
  };

  const canPause = (status: string) => status === 'running' || status === 'waiting' || status === 'delayed';
  const canResume = (status: string) => status === 'paused';
  const canStop = (status: string) => status !== 'completed' && status !== 'failed' && status !== 'removed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrichment Jobs</CardTitle>
        <CardDescription>Track your ongoing enrichment tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => {
          const StatusIcon = getStatusIcon(job.status);
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
                    <Badge variant={getStatusColor(job.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.completedRows} of {job.totalRows} rows completed
                  </p>
                </div>
                <div className="flex gap-1">
                  {canPause(job.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'pause')}
                      title="Pause job"
                      className="h-7 w-7 p-0"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canResume(job.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'resume')}
                      title="Resume job"
                      className="h-7 w-7 p-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canStop(job.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'stop')}
                      title="Stop job"
                      className="h-7 w-7 p-0"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  )}
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
