"use client";

import { useState } from "react";
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
import { Zap, Search } from "lucide-react";

interface ProviderSelectorProps {
  llmProviders: LLMProvider[];
  searchProviders: SearchProvider[];
  selectedLLM?: string;
  selectedSearch?: string;
  onSelect: (llmId?: string, searchId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ProviderSelector({
  llmProviders,
  searchProviders,
  selectedLLM,
  selectedSearch,
  onSelect,
  isOpen,
  onClose,
}: ProviderSelectorProps) {
  const [llmId, setLlmId] = useState(selectedLLM);
  const [searchId, setSearchId] = useState(selectedSearch);

  const handleSave = () => {
    onSelect(llmId, searchId);
    onClose();
  };

  const activeLLMs = llmProviders.filter((p) => p.isActive);
  const activeSearchProviders = searchProviders.filter((p) => p.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Providers</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              LLM Provider
            </Label>
            <Select value={llmId} onValueChange={setLlmId}>
              <SelectTrigger>
                <SelectValue placeholder="Select LLM provider" />
              </SelectTrigger>
              <SelectContent>
                {activeLLMs.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {provider.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeLLMs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active LLM providers available
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Provider (Optional)
            </Label>
            <Select value={searchId} onValueChange={setSearchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select search provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {activeSearchProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {provider.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!llmId}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
