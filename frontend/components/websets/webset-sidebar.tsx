"use client";

import { useState } from "react";
import type { ColumnDefinition } from "@/types/webset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/react-scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Columns,
  Filter,
  Settings,
  Plus,
  Edit,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";

interface WebsetSidebarProps {
  columns: ColumnDefinition[];
  onAddColumn: () => void;
  onEditColumn: (column: ColumnDefinition) => void;
  visibleColumns: string[];
  onToggleColumn: (columnId: string) => void;
}

export function WebsetSidebar({
  columns,
  onAddColumn,
  onEditColumn,
  visibleColumns,
  onToggleColumn,
}: WebsetSidebarProps) {
  const [filterText, setFilterText] = useState("");

  return (
    <div className="w-80 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Webset Settings
        </h2>
      </div>

      <Tabs defaultValue="columns" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="columns" className="flex-1">
            <Columns className="h-4 w-4 mr-2" />
            Columns
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="columns" className="flex-1 flex flex-col px-4 pb-4">
          <div className="mb-4">
            <Button onClick={onAddColumn} className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {columns.map((column, index) => {
                const isVisible = visibleColumns.includes(column.id);
                return (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {column.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {column.type}
                        </Badge>
                        {column.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleColumn(column.id)}
                      >
                        {isVisible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditColumn(column)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="filters" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Filter rows..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Quick Filters</Label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Filter className="mr-2 h-3 w-3" />
                  High Confidence (&gt; 80%)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Filter className="mr-2 h-3 w-3" />
                  With Citations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Filter className="mr-2 h-3 w-3" />
                  Empty Cells
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
