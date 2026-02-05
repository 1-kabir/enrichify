'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  ArrowLeft, 
  Play, 
  Pause, 
  Square, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileText,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnrichmentJobHistory {
  id: string;
  jobId: string;
  websetId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'stopped';
  parameters: Record<string, any>;
  summary?: Record<string, any>;
  errorMessage?: string;
  totalRows?: number;
  processedRows?: number;
  failedRows?: number;
  llmProviderId?: string;
  searchProviderId?: string;
  targetColumn?: string;
  startTime: string;
  endTime: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export default function EnrichmentHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<EnrichmentJobHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobHistory();
  }, [page, filterStatus, searchTerm]);

  const fetchJobHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/enrichment/history?${params.toString()}`);
      setJobs(response.data.jobs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch job history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrichment job history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'failed': return XCircle;
      case 'running': return Play;
      case 'paused': return Pause;
      case 'stopped': return Square;
      default: return Clock;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'running': return 'default';
      case 'paused': return 'secondary';
      case 'stopped': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'running': return 'text-blue-500';
      case 'paused': return 'text-yellow-500';
      case 'stopped': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col bg-[#0d0d0d]">
          {/* Header */}
          <div className="border-b border-[#262626] p-4 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="text-[#a3a3a3] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="h-4 w-[1px] bg-[#262626]" />
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-bold text-white tracking-tight">Enrichment History</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Filters */}
              <Card className="bg-[#141414] border-[#262626]">
                <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#666666]" />
                    <span className="text-sm text-[#a3a3a3]">Filter by:</span>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1); // Reset to first page when filter changes
                    }}
                    className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="paused">Paused</option>
                    <option value="stopped">Stopped</option>
                  </select>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <Search className="h-4 w-4 text-[#666666]" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset to first page when search changes
                      }}
                      className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary w-64"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full bg-[#1a1a1a] rounded-xl" />
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto mb-4 text-[#333333]" />
                    <h3 className="text-lg font-medium text-white mb-1">No enrichment jobs found</h3>
                    <p className="text-[#a3a3a3]">Your enrichment job history will appear here</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {jobs.map((job) => {
                      const StatusIcon = getStatusIcon(job.status);
                      const duration = formatDuration(job.durationSeconds);
                      const successRate = job.totalRows && job.processedRows 
                        ? Math.round((job.processedRows / job.totalRows) * 100) 
                        : 0;
                      
                      return (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 border rounded-xl bg-[#141414] border-[#262626] hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${getStatusColor(job.status)} bg-opacity-10`}>
                                  <StatusIcon className={`h-5 w-5 ${getStatusColor(job.status)}`} />
                                </div>
                                <div>
                                  <h3 className="font-medium text-white flex items-center gap-2">
                                    Job {job.jobId.substring(0, 8)}...
                                    <Badge variant={getStatusVariant(job.status)} className="capitalize">
                                      {job.status}
                                    </Badge>
                                  </h3>
                                  <p className="text-xs text-[#a3a3a3]">
                                    Started: {formatDate(job.startTime)} • Duration: {duration}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-[#666666]">Target Column</p>
                                  <p className="text-white">{job.targetColumn || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[#666666]">Rows</p>
                                  <p className="text-white">
                                    {job.processedRows || 0}/{job.totalRows || 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[#666666]">Success Rate</p>
                                  <p className="text-white">{successRate}%</p>
                                </div>
                                <div>
                                  <p className="text-[#666666]">Provider</p>
                                  <p className="text-white text-xs">
                                    {job.llmProviderId || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              
                              {job.errorMessage && (
                                <div className="mt-2 text-sm text-red-500 flex items-center gap-2">
                                  <XCircle className="h-4 w-4" />
                                  {job.errorMessage}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-[#333333] text-[#a3a3a3] hover:text-white"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-[#333333] text-[#a3a3a3] hover:text-white"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#a3a3a3]">
                    Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total} jobs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-[#333333] text-[#a3a3a3] hover:text-white"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-white mx-2">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-[#333333] text-[#a3a3a3] hover:text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}