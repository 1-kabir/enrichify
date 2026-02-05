'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationDialogProps {
  websetId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VerificationResult {
  websetId: string;
  isValid: boolean;
  issues: {
    orphanedCells: number;
    typeMismatches: number;
    missingRequiredFields: number;
  };
  details: {
    orphanedCells: any[];
    typeMismatches: any[];
    missingRequiredFields: any[];
  };
  timestamp: string;
}

export function VerificationDialog({ websetId, isOpen, onClose }: VerificationDialogProps) {
  const { toast } = useToast();
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);

  const runVerification = async () => {
    setIsVerifying(true);
    setProgress(0);
    setVerificationResult(null);

    try {
      // Simulate verification progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform verification
      const response = await api.post(`/websets/${websetId}/verify`);
      const result = response.data;

      clearInterval(interval);
      setProgress(100);
      setVerificationResult(result);

      toast({
        title: "Verification Complete",
        description: result.isValid 
          ? "No issues found in your webset!" 
          : `Found ${Object.values(result.issues).reduce((sum, count) => sum + count, 0)} issues`,
      });
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Could not verify the webset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isOpen && !verificationResult) {
      runVerification();
    }
  }, [isOpen]);

  const getTotalIssues = () => {
    if (!verificationResult) return 0;
    return Object.values(verificationResult.issues).reduce((sum, count) => sum + count, 0);
  };

  const getIssueSeverity = () => {
    const total = getTotalIssues();
    if (total === 0) return { color: 'green', label: 'No Issues' };
    if (total < 5) return { color: 'yellow', label: 'Minor Issues' };
    if (total < 10) return { color: 'orange', label: 'Moderate Issues' };
    return { color: 'red', label: 'Major Issues' };
  };

  const severity = getIssueSeverity();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-[#0d0d0d] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Data Verification
          </DialogTitle>
          <DialogDescription>
            Check your webset for data integrity issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-auto max-h-[60vh] pr-2">
          {isVerifying ? (
            <div className="space-y-4">
              <div className="flex justify-center py-8">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RotateCcw className="h-10 w-10 text-primary animate-spin" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Verifying data integrity...</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          ) : verificationResult ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Verification Summary</span>
                    {verificationResult.isValid ? (
                      <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        Issues Found
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Analysis performed on {new Date(verificationResult.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333333]">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-[#a3a3a3]">Type Mismatches</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{verificationResult.issues.typeMismatches}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333333]">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-[#a3a3a3]">Missing Fields</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{verificationResult.issues.missingRequiredFields}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333333]">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-[#a3a3a3]">Orphaned Cells</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{verificationResult.issues.orphanedCells}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issue Details */}
              <div className="space-y-4">
                {verificationResult.details.typeMismatches.length > 0 && (
                  <Card className="bg-[#141414] border-[#262626]">
                    <CardHeader>
                      <CardTitle className="text-red-500 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Type Mismatches ({verificationResult.details.typeMismatches.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {verificationResult.details.typeMismatches.map((issue, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg bg-[#0d0d0d] border border-[#333333] text-sm"
                          >
                            <div className="font-medium">Row {issue.row}, Column {issue.column}</div>
                            <div className="text-[#a3a3a3]">Expected: {issue.expectedType}, Got: {issue.actualType}</div>
                            <div className="text-[#666666] mt-1">Value: "{issue.value}"</div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {verificationResult.details.missingRequiredFields.length > 0 && (
                  <Card className="bg-[#141414] border-[#262626]">
                    <CardHeader>
                      <CardTitle className="text-orange-500 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Missing Required Fields ({verificationResult.details.missingRequiredFields.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {verificationResult.details.missingRequiredFields.map((issue, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg bg-[#0d0d0d] border border-[#333333] text-sm"
                          >
                            <div className="font-medium">Row {issue.row}, Column {issue.columnName}</div>
                            <div className="text-[#a3a3a3]">Required field is empty</div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {verificationResult.details.orphanedCells.length > 0 && (
                  <Card className="bg-[#141414] border-[#262626]">
                    <CardHeader>
                      <CardTitle className="text-blue-500 flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Orphaned Cells ({verificationResult.details.orphanedCells.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {verificationResult.details.orphanedCells.map((issue, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg bg-[#0d0d0d] border border-[#333333] text-sm"
                          >
                            <div className="font-medium">Cell ID: {issue.id}</div>
                            <div className="text-[#a3a3a3]">Row {issue.row}, Column {issue.column}</div>
                            <div className="text-[#666666] mt-1">References non-existent column</div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {getTotalIssues() === 0 && (
                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">
                      No issues found! Your webset data is clean and valid.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[#a3a3a3]">
              <FileCheck className="h-12 w-12 mx-auto mb-4 text-[#333333]" />
              <p>Verification results will appear here</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#333333] text-[#a3a3a3] hover:text-white">
            Close
          </Button>
          <Button onClick={runVerification} disabled={isVerifying}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {isVerifying ? 'Verifying...' : 'Re-run Verification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}