'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Table2, 
  ArrowLeft, 
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewWebsetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [websetId, setWebsetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv') && 
          !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV, XLS, or XLSX file.',
          variant: 'destructive',
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv') && 
          !file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV, XLS, or XLSX file.',
          variant: 'destructive',
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Make API call to upload file
      const response = await api.post('/websets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus('success');
      setWebsetId(response.data.id);

      toast({
        title: 'Upload Successful',
        description: 'Your webset has been created successfully!',
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/websets/${response.data.id}`);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description: (error as any).response?.data?.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('csv') || file.name.endsWith('.csv')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    return <Table2 className="h-8 w-8 text-purple-500" />;
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col bg-[#0d0d0d]">
          {/* Header */}
          <div className="border-b border-[#262626] p-4 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-[#a3a3a3] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="h-4 w-[1px] bg-[#262626]" />
              <h1 className="text-xl font-bold text-white tracking-tight">New Webset from File</h1>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-[#141414] border-[#262626]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Data File
                  </CardTitle>
                  <p className="text-sm text-[#a3a3a3]">
                    Import your data from a CSV, XLS, or XLSX file to create a new webset
                  </p>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      uploadedFile 
                        ? 'border-[#333333] bg-[#1a1a1a]' 
                        : 'border-[#333333] bg-[#0d0d0d] hover:border-primary/50 hover:bg-[#1a1a1a]'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {!uploadedFile ? (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <Upload className="h-8 w-8 text-[#666666]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Drag & drop your file here</p>
                          <p className="text-[#666666] text-sm mt-1">or</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="border-[#333333] text-[#a3a3a3] hover:text-white"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                        <p className="text-[#666666] text-xs mt-2">
                          Supported formats: CSV, XLS, XLSX
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          {getFileIcon(uploadedFile)}
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-xs mx-auto">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[#666666] text-sm mt-1">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        
                        {uploadStatus === 'uploading' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#a3a3a3]">Uploading...</span>
                              <span className="text-white">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                        
                        {uploadStatus === 'success' && (
                          <div className="space-y-2">
                            <div className="flex justify-center">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-white font-medium">Upload Successful!</p>
                            <p className="text-[#666666] text-sm">Redirecting to your webset...</p>
                          </div>
                        )}
                        
                        {uploadStatus === 'error' && (
                          <div className="space-y-2">
                            <div className="flex justify-center">
                              <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-white font-medium">Upload Failed</p>
                            <p className="text-[#666666] text-sm">Please try again</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            className="border-[#333333] text-[#a3a3a3] hover:text-white"
                            onClick={handleRemoveFile}
                            disabled={isUploading}
                          >
                            Remove
                          </Button>
                          <Button 
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={handleUpload}
                            disabled={isUploading}
                          >
                            {isUploading ? 'Uploading...' : 'Import File'}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <h3 className="font-medium text-white">How to prepare your file:</h3>
                    <ul className="space-y-2 text-[#a3a3a3] text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Include column headers in the first row</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Each row represents a record in your webset</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Supports CSV, XLS, and XLSX formats</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Maximum file size: 10MB</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}