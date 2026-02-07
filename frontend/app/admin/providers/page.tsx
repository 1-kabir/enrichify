'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminProviderManagement } from '@/components/admin/admin-provider-management';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function AdminProvidersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'ADMIN') {
      toast({
        title: 'Access Denied',
        description: 'You must be an admin to access this page.',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && user.role !== 'ADMIN')) {
    return null; // Render nothing while checking auth or if not admin
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col bg-[#0d0d0d]">
          <div className="border-b border-[#262626] p-4 bg-[#0d0d0d]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-white">Admin Provider Management</h1>
              <p className="text-[#a3a3a3] mt-1">
                Configure system-wide provider settings and permissions
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <AdminProviderManagement />
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}