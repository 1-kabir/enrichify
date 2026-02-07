"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { LLMProvider, SearchProvider } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Search, KeyRound, Shield } from "lucide-react";

interface SystemProvider {
  id: string;
  name: string;
  type: string;
  hasAdminKey: boolean;
  canUserProvideKey: boolean;
  isDefaultForUsers: boolean;
  isAvailableToUsers: boolean;
}

interface UserProviderConfig {
  id: string;
  providerName: string;
  systemLlmProviderId?: string;
  systemSearchProviderId?: string;
  hasUserKey: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetUserProvidersResponse {
  systemProviders: {
    llm: SystemProvider[];
    search: SystemProvider[];
  };
  userConfigs: UserProviderConfig[];
}

interface ProviderSelectorProps {
  websetId: string;
  selectedLLM?: string;
  selectedSearch?: string;
  onSelect: (llmId?: string, searchId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ProviderSelector({
  websetId,
  selectedLLM,
  selectedSearch,
  onSelect,
  isOpen,
  onClose,
}: ProviderSelectorProps) {
  const { toast } = useToast();
  const [llmId, setLlmId] = useState<string | undefined>(selectedLLM);
  const [searchId, setSearchId] = useState<string | undefined>(selectedSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [providerOptions, setProviderOptions] = useState<{
    llm: Array<{ id: string; name: string; type: string; hasKey: boolean; isSystem: boolean; providerName?: string }>;
    search: Array<{ id: string; name: string; type: string; hasKey: boolean; isSystem: boolean; providerName?: string }>;
  }>({ llm: [], search: [] });

  useEffect(() => {
    if (isOpen) {
      loadProviderOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    setLlmId(selectedLLM);
    setSearchId(selectedSearch);
  }, [selectedLLM, selectedSearch]);

  const loadProviderOptions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/settings/providers');
      const data: GetUserProvidersResponse = response.data;

      // Create options combining system providers and user configs
      const llmOptions = [];
      
      // Add user configs for LLM providers
      for (const config of data.userConfigs) {
        if (config.systemLlmProviderId) {
          const systemProvider = data.systemProviders.llm.find(p => p.id === config.systemLlmProviderId);
          if (systemProvider) {
            llmOptions.push({
              id: config.id, // Use the user config ID
              name: systemProvider.name,
              type: systemProvider.type,
              hasKey: config.hasUserKey,
              isSystem: false,
              providerName: config.providerName,
            });
          }
        }
      }

      // Add system providers that are available and have admin keys
      for (const provider of data.systemProviders.llm) {
        if (provider.isAvailableToUsers && provider.hasAdminKey) {
          llmOptions.push({
            id: provider.id, // Use the system provider ID
            name: provider.name,
            type: provider.type,
            hasKey: provider.hasAdminKey,
            isSystem: true,
          });
        }
      }

      const searchOptions = [];
      
      // Add user configs for search providers
      for (const config of data.userConfigs) {
        if (config.systemSearchProviderId) {
          const systemProvider = data.systemProviders.search.find(p => p.id === config.systemSearchProviderId);
          if (systemProvider) {
            searchOptions.push({
              id: config.id, // Use the user config ID
              name: systemProvider.name,
              type: systemProvider.type,
              hasKey: config.hasUserKey,
              isSystem: false,
              providerName: config.providerName,
            });
          }
        }
      }

      // Add system providers that are available and have admin keys
      for (const provider of data.systemProviders.search) {
        if (provider.isAvailableToUsers && provider.hasAdminKey) {
          searchOptions.push({
            id: provider.id, // Use the system provider ID
            name: provider.name,
            type: provider.type,
            hasKey: provider.hasAdminKey,
            isSystem: true,
          });
        }
      }

      setProviderOptions({ llm: llmOptions, search: searchOptions });
    } catch (error) {
      console.error('Failed to load provider options:', error);
      toast({
        title: "Error",
        description: "Failed to load provider options.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    onSelect(llmId, searchId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Select Providers
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              LLM Provider
            </Label>
            {isLoading ? (
              <div className="h-10 w-full bg-[#1a1a1a] rounded-md animate-pulse"></div>
            ) : (
              <Select value={llmId} onValueChange={(value) => setLlmId(value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select LLM provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.llm.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {provider.type}
                        </Badge>
                        {provider.isSystem ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-500 text-[10px] px-1.5 py-0.5 h-fit">
                            <Shield className="h-2.5 w-2.5 mr-1" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary/30 text-primary text-[10px] px-1.5 py-0.5 h-fit">
                            <KeyRound className="h-2.5 w-2.5 mr-1" />
                            {provider.providerName}
                          </Badge>
                        )}
                        {!provider.hasKey && (
                          <Badge variant="outline" className="border-red-500/30 text-red-500 text-[10px] px-1.5 py-0.5 h-fit">
                            No Key
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {providerOptions.llm.length === 0 && !isLoading && (
              <p className="text-sm text-[#666666]">
                No LLM providers available. Contact your administrator or add your own API key.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Provider (Optional)
            </Label>
            {isLoading ? (
              <div className="h-10 w-full bg-[#1a1a1a] rounded-md animate-pulse"></div>
            ) : (
              <Select value={searchId} onValueChange={(value) => setSearchId(value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select search provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {providerOptions.search.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {provider.type}
                        </Badge>
                        {provider.isSystem ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-500 text-[10px] px-1.5 py-0.5 h-fit">
                            <Shield className="h-2.5 w-2.5 mr-1" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary/30 text-primary text-[10px] px-1.5 py-0.5 h-fit">
                            <KeyRound className="h-2.5 w-2.5 mr-1" />
                            {provider.providerName}
                          </Badge>
                        )}
                        {!provider.hasKey && (
                          <Badge variant="outline" className="border-red-500/30 text-red-500 text-[10px] px-1.5 py-0.5 h-fit">
                            No Key
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!llmId || isLoading}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
