'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Table2, 
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface FileUploadDialogProps {
  onUploadSuccess?: (websetId: string) => void;
}

export function FileUploadDialog({ onUploadSuccess }: FileUploadDialogProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
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

      toast({
        title: 'Upload Successful',
        description: 'Your webset has been created successfully!',
      });

      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(response.data.id);
      }

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogOpen = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
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
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0d0d0d] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Data File
          </DialogTitle>
        </DialogHeader>
        
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            uploadedFile 
              ? 'border-[#333333] bg-[#1a1a1a]' 
              : 'border-[#333333] bg-[#0d0d0d] hover:border-primary/50 hover:bg-[#1a1a1a]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!uploadedFile ? (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <Upload className="h-6 w-6 text-[#666666]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Drag & drop your file here</p>
                <p className="text-[#666666] text-xs mt-1">or</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#333333] text-[#a3a3a3] hover:text-white text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-[#666666] text-xs">
                Supported formats: CSV, XLS, XLSX
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                {getFileIcon(uploadedFile)}
              </div>
              <div>
                <p className="text-white font-medium text-sm truncate max-w-xs mx-auto">
                  {uploadedFile.name}
                </p>
                <p className="text-[#666666] text-xs mt-1">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              {uploadStatus === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#a3a3a3]">Uploading...</span>
                    <span className="text-white">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-white font-medium text-sm">Upload Successful!</p>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-white font-medium text-sm">Upload Failed</p>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#333333] text-[#a3a3a3] hover:text-white text-xs"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  Remove
                </Button>
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white text-xs"
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
      </DialogContent>
    </Dialog>
  );
}