'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  KeyRound,
  Search,
  Bot,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProviderType } from '@/types/settings';

interface ProviderConfig {
  id: string;
  providerType: ProviderType;
  providerId: string;
  providerName: string;
  providerDisplayName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DefaultProviders {
  defaultLlmProviderId: string | null;
  defaultSearchProviderId: string | null;
}

export function ProviderManagement() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [defaultProviders, setDefaultProviders] = useState<DefaultProviders>({
    defaultLlmProviderId: null,
    defaultSearchProviderId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [dialogForm, setDialogForm] = useState({
    providerType: 'llm' as ProviderType,
    providerId: '',
    providerName: '',
    apiKey: '',
    isDefault: false,
  });

  // Available providers from the backend
  const [availableProviders, setAvailableProviders] = useState<{
    llm: { id: string; name: string; type: string }[];
    search: { id: string; name: string; type: string }[];
  }>({ llm: [], search: [] });

  useEffect(() => {
    loadProviders();
    loadAvailableProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const [configsRes, defaultsRes] = await Promise.all([
        api.get('/settings/providers'),
        api.get('/settings/defaults'),
      ]);
      
      setProviders(configsRes.data);
      setDefaultProviders(defaultsRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load provider configurations.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableProviders = async () => {
    try {
      // In a real app, we would fetch available providers from the backend
      // For now, we'll mock this with some sample data
      // In practice, this would be separate API calls to get available LLM and search providers
      setAvailableProviders({
        llm: [
          { id: 'openai-1', name: 'OpenAI GPT-4', type: 'openai' },
          { id: 'anthropic-1', name: 'Anthropic Claude', type: 'claude' },
          { id: 'gemini-1', name: 'Google Gemini', type: 'gemini' },
        ],
        search: [
          { id: 'tavily-1', name: 'Tavily Search', type: 'tavily' },
          { id: 'exa-1', name: 'Exa AI', type: 'exa' },
          { id: 'serper-1', name: 'Serper', type: 'serper' },
        ]
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available providers.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProvider) {
        // Update existing provider
        await api.patch(`/settings/providers/${editingProvider.id}`, {
          providerName: dialogForm.providerName,
          apiKey: dialogForm.apiKey,
          isDefault: dialogForm.isDefault,
        });
        toast({
          title: 'Success',
          description: 'Provider configuration updated successfully.',
        });
      } else {
        // Create new provider
        await api.post('/settings/providers', {
          providerType: dialogForm.providerType,
          providerId: dialogForm.providerId,
          providerName: dialogForm.providerName,
          apiKey: dialogForm.apiKey,
          isDefault: dialogForm.isDefault,
        });
        toast({
          title: 'Success',
          description: 'Provider configuration added successfully.',
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProviders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save provider configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider configuration?')) {
      return;
    }

    try {
      await api.delete(`/settings/providers/${id}`);
      toast({
        title: 'Success',
        description: 'Provider configuration deleted successfully.',
      });
      loadProviders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete provider configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string, type: ProviderType) => {
    try {
      const updateObj: any = {};
      if (type === 'llm') {
        updateObj.defaultLlmProviderId = id;
      } else {
        updateObj.defaultSearchProviderId = id;
      }
      
      await api.patch('/settings/defaults', updateObj);
      toast({
        title: 'Success',
        description: 'Default provider updated successfully.',
      });
      loadProviders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default provider.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setDialogForm({
      providerType: 'llm',
      providerId: '',
      providerName: '',
      apiKey: '',
      isDefault: false,
    });
    setEditingProvider(null);
  };

  const handleDialogOpen = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const handleEdit = (provider: ProviderConfig) => {
    setEditingProvider(provider);
    setDialogForm({
      providerType: provider.providerType,
      providerId: provider.providerId,
      providerName: provider.providerName,
      apiKey: '', // Don't expose the API key
      isDefault: provider.isDefault,
    });
    setIsDialogOpen(true);
  };

  const filteredLlmProviders = availableProviders.llm.filter(
    p => !providers.some(config => config.providerId === p.id)
  );
  
  const filteredSearchProviders = availableProviders.search.filter(
    p => !providers.some(config => config.providerId === p.id)
  );

  return (
    <div className="space-y-6">
      <Card className="bg-[#141414] border-[#262626]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Provider Configurations
            </CardTitle>
            <p className="text-sm text-[#a3a3a3] mt-1">
              Manage your BYOK (Bring Your Own Key) provider configurations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Plus className="h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0d0d0d] border-[#333333] text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  {editingProvider ? 'Edit Provider' : 'Add New Provider'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="providerType">Provider Type</Label>
                    <Select 
                      value={dialogForm.providerType} 
                      onValueChange={(value: ProviderType) => setDialogForm({...dialogForm, providerType: value})}
                    >
                      <SelectTrigger className="bg-[#1a1a1a] border-[#333333]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333333]">
                        <SelectItem value="llm">LLM Provider</SelectItem>
                        <SelectItem value="search">Search Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="providerId">Provider</Label>
                  <Select 
                    value={dialogForm.providerId} 
                    onValueChange={(value) => setDialogForm({...dialogForm, providerId: value})}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-[#333333]">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333333] max-h-60">
                      {dialogForm.providerType === 'llm' 
                        ? filteredLlmProviders.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))
                        : filteredSearchProviders.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="providerName">Configuration Name</Label>
                  <Input
                    id="providerName"
                    value={dialogForm.providerName}
                    onChange={(e) => setDialogForm({...dialogForm, providerName: e.target.value})}
                    placeholder="My OpenAI Key"
                    className="bg-[#1a1a1a] border-[#333333]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={dialogForm.apiKey}
                    onChange={(e) => setDialogForm({...dialogForm, apiKey: e.target.value})}
                    placeholder="sk-... or your API key"
                    className="bg-[#1a1a1a] border-[#333333]"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={dialogForm.isDefault}
                    onChange={(e) => setDialogForm({...dialogForm, isDefault: e.target.checked})}
                    className="h-4 w-4 rounded border-[#333333] bg-[#1a1a1a] text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">
                    Set as default {dialogForm.providerType === 'llm' ? 'LLM' : 'Search'} provider
                  </Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleDialogOpen(false)}
                    className="border-[#333333] text-[#a3a3a3] hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                    {editingProvider ? 'Update' : 'Add'} Provider
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#262626]">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-[#262626] rounded"></div>
                    <div className="h-3 w-32 bg-[#262626] rounded"></div>
                  </div>
                  <div className="h-8 w-24 bg-[#262626] rounded"></div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-[#a3a3a3]">
              <KeyRound className="h-12 w-12 mx-auto mb-3 text-[#333333]" />
              <p>No provider configurations yet</p>
              <p className="text-sm mt-1">Add your first provider to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {providers.map((provider) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#262626] group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {provider.providerType === 'llm' ? (
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Bot className="h-5 w-5 text-blue-500" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Search className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {provider.providerName}
                          {provider.isDefault && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0.5 h-fit">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-[#a3a3a3]">
                          {provider.providerDisplayName} • {new Date(provider.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(provider.id, provider.providerType)}
                        disabled={provider.isDefault}
                        className={`h-8 w-8 p-0 ${provider.isDefault ? 'text-[#666666]' : 'text-[#a3a3a3] hover:text-white'}`}
                        title={provider.isDefault ? 'Default provider' : 'Set as default'}
                      >
                        {provider.isDefault ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Settings2 className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                        className="h-8 w-8 p-0 text-[#a3a3a3] hover:text-white"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(provider.id)}
                        className="h-8 w-8 p-0 text-[#a3a3a3] hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}