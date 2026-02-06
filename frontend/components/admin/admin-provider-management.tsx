'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Settings2,
  Bot,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isAvailableToUsers: boolean;
  canUserProvideKey: boolean;
  isDefaultForUsers: boolean;
  hasApiKey: boolean;
}

export function AdminProviderManagement() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<{ llm: SystemProvider[], search: SystemProvider[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSystemProviders();
  }, []);

  const fetchSystemProviders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch system providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system providers.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderSetting = async (
    providerType: 'llm' | 'search',
    providerId: string,
    setting: 'isAvailableToUsers' | 'canUserProvideKey' | 'isDefaultForUsers',
    value: boolean
  ) => {
    try {
      setSaving(prev => ({ ...prev, [`${providerType}-${providerId}-${setting}`]: true }));
      
      const updateData: any = {};
      updateData[setting] = value;
      
      await api.patch(`/admin/providers/${providerType}/${providerId}`, updateData);
      
      // Update local state
      setProviders(prev => {
        if (!prev) return prev;
        
        const providerList = providerType === 'llm' ? prev.llm : prev.search;
        const updatedList = providerList.map(provider => 
          provider.id === providerId 
            ? { ...provider, [setting]: value } 
            : provider
        );
        
        return providerType === 'llm' 
          ? { ...prev, llm: updatedList } 
          : { ...prev, search: updatedList };
      });
      
      toast({
        title: 'Success',
        description: 'Provider settings updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update provider setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update provider setting.',
        variant: 'destructive',
      });
    } finally {
      setSaving(prev => ({ ...prev, [`${providerType}-${providerId}-${setting}`]: false }));
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">System Provider Management</h1>
          <p className="text-[#a3a3a3]">Configure which providers are available to users and their permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Providers */}
        <Card className="bg-[#141414] border-[#262626]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-white">LLM Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {providers?.llm.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border border-[#262626] rounded-lg bg-[#1a1a1a] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-[#0d0d0d] border border-[#333333]">
                        {getStatusIcon(provider.isActive)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{provider.name}</h3>
                        <p className="text-xs text-[#666666] capitalize">{provider.type}</p>
                      </div>
                    </div>
                    {provider.hasApiKey ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] px-2 py-1">
                        <KeyRound className="h-3 w-3 mr-1" />
                        Admin Key Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-[#333333] text-[#666666] text-[10px] px-2 py-1">
                        <KeyRound className="h-3 w-3 mr-1" />
                        No Admin Key
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Available to Users</span>
                      <Switch
                        checked={provider.isAvailableToUsers}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('llm', provider.id, 'isAvailableToUsers', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-isAvailableToUsers`]}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Allow User Keys</span>
                      <Switch
                        checked={provider.canUserProvideKey}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('llm', provider.id, 'canUserProvideKey', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-canUserProvideKey`]}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Default for Users</span>
                      <Switch
                        checked={provider.isDefaultForUsers}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('llm', provider.id, 'isDefaultForUsers', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-isDefaultForUsers`]}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Search Providers */}
        <Card className="bg-[#141414] border-[#262626]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-white">Search Providers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {providers?.search.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border border-[#262626] rounded-lg bg-[#1a1a1a] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-[#0d0d0d] border border-[#333333]">
                        {getStatusIcon(provider.isActive)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{provider.name}</h3>
                        <p className="text-xs text-[#666666] capitalize">{provider.type}</p>
                      </div>
                    </div>
                    {provider.hasApiKey ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30 text-[10px] px-2 py-1">
                        <KeyRound className="h-3 w-3 mr-1" />
                        Admin Key Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-[#333333] text-[#666666] text-[10px] px-2 py-1">
                        <KeyRound className="h-3 w-3 mr-1" />
                        No Admin Key
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Available to Users</span>
                      <Switch
                        checked={provider.isAvailableToUsers}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('search', provider.id, 'isAvailableToUsers', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-isAvailableToUsers`]}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Allow User Keys</span>
                      <Switch
                        checked={provider.canUserProvideKey}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('search', provider.id, 'canUserProvideKey', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-canUserProvideKey`]}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#a3a3a3]">Default for Users</span>
                      <Switch
                        checked={provider.isDefaultForUsers}
                        onCheckedChange={(checked) => 
                          updateProviderSetting('search', provider.id, 'isDefaultForUsers', checked)
                        }
                        disabled={saving[`${provider.type}-${provider.id}-isDefaultForUsers`]}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}