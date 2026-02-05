'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings2, 
  KeyRound,
  Search,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProviderManagement } from '@/components/settings/provider-management';

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(true);

  // Mock user data - in real app, this would come from auth context
  const [user, setUser] = useState({
    id: 'user-id',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'user',
  });

  useEffect(() => {
    // Load user settings
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // In a real app, we would fetch user settings here
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load settings.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="p-8 space-y-6">
            <Skeleton className="h-10 w-64 bg-white/5" />
            <Skeleton className="h-96 w-full bg-white/5 rounded-2xl" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col bg-[#0d0d0d]">
          {/* Header */}
          <div className="border-b border-[#262626] p-4 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 gap-1.5 uppercase tracking-wider text-[10px] font-bold">
                <Settings2 className="h-3 w-3" />
                Personal
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6 bg-[#1a1a1a] p-1 border border-[#333333]">
                <TabsTrigger 
                  value="providers" 
                  className="data-[state=active]:bg-[#262626] data-[state=active]:text-white data-[state=inactive]:text-[#a3a3a3] data-[state=inactive]:hover:text-white transition-all"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Providers
                </TabsTrigger>
                <TabsTrigger 
                  value="account" 
                  className="data-[state=active]:bg-[#262626] data-[state=active]:text-white data-[state=inactive]:text-[#a3a3a3] data-[state=inactive]:hover:text-white transition-all"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="providers" className="focus-visible:outline-none">
                <ProviderManagement />
              </TabsContent>

              <TabsContent value="account" className="focus-visible:outline-none">
                <Card className="bg-[#141414] border-[#262626]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#a3a3a3]">Username</label>
                      <div className="text-white">{user.username}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#a3a3a3]">Email</label>
                      <div className="text-white">{user.email}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#a3a3a3]">Role</label>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}