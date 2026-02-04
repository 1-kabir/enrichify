"use client";

import { useState } from "react";
import type { ColumnDefinition, EnrichmentJob } from "@/types/webset";
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
    Cpu,
    Activity,
    CheckCircle2,
    Clock,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WebsetSidebarProps {
    columns: ColumnDefinition[];
    onAddColumn: () => void;
    onEditColumn: (column: ColumnDefinition) => void;
    visibleColumns: string[];
    onToggleColumn: (columnId: string) => void;
    jobs?: EnrichmentJob[];
}

export function WebsetSidebar({
    columns,
    onAddColumn,
    onEditColumn,
    visibleColumns,
    onToggleColumn,
    jobs = []
}: WebsetSidebarProps) {
    const [filterText, setFilterText] = useState("");

    const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending');

    return (
        <div className="w-80 border-l border-[#262626] bg-[#0d0d0d] flex flex-col h-full text-white">
            <div className="p-4 border-b border-[#262626] flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2 text-sm text-[#a3a3a3]">
                    <Settings className="h-4 w-4" />
                    Workspace
                </h2>
                {activeJobs.length > 0 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse text-[10px] uppercase font-bold px-1.5 py-0">
                        {activeJobs.length} Active
                    </Badge>
                )}
            </div>

            <Tabs defaultValue="columns" className="flex-1 flex flex-col">
                <TabsList className="mx-2 mt-4 bg-[#1a1a1a] p-1 h-9 rounded-lg border border-[#333333]">
                    <TabsTrigger value="columns" className="flex-1 text-[11px] data-[state=active]:bg-[#262626] data-[state=active]:text-white transition-all">
                        <Columns className="h-3 w-3 mr-1.5" />
                        Columns
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="flex-1 text-[11px] data-[state=active]:bg-[#262626] data-[state=active]:text-white transition-all">
                        <Cpu className="h-3 w-3 mr-1.5" />
                        Agents
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="flex-1 text-[11px] data-[state=active]:bg-[#262626] data-[state=active]:text-white transition-all">
                        <Filter className="h-3 w-3 mr-1.5" />
                        Filters
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="columns" className="flex-1 flex flex-col px-4 pb-4 focus-visible:outline-none">
                    <div className="my-4">
                        <Button
                            onClick={onAddColumn}
                            className="w-full bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-xs h-8 text-[#a3a3a3] hover:text-white transition-all gap-2"
                            variant="outline"
                        >
                            <Plus className="h-3 w-3" />
                            New Column
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 h-[calc(100vh-250px)]">
                        <div className="space-y-2 pr-4 custom-scrollbar">
                            {columns.map((column, index) => {
                                const isVisible = visibleColumns.includes(column.id);
                                return (
                                    <motion.div
                                        key={column.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "group flex items-center gap-2 p-2.5 border rounded-xl transition-all duration-200",
                                            isVisible ? "bg-[#1a1a1a] border-[#333333]" : "bg-transparent border-transparent opacity-50"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate text-white">
                                                {column.name}
                                            </div>
                                            <div className="text-[10px] text-[#666666] mt-0.5 uppercase font-mono tracking-tight">
                                                {column.type}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-[#666666] hover:text-white"
                                                onClick={() => onToggleColumn(column.id)}
                                            >
                                                {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-[#666666] hover:text-white"
                                                onClick={() => onEditColumn(column)}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="agents" className="flex-1 px-4 pb-4 focus-visible:outline-none">
                    <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                        <div className="space-y-4 pr-4">
                            {jobs.length === 0 ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="p-3 bg-white/5 rounded-full">
                                        <Activity className="h-6 w-6 text-[#333333]" />
                                    </div>
                                    <p className="text-xs text-[#666666]">No active agents.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {[...jobs].reverse().map((job, idx) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {job.status === 'running' ? (
                                                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                                    ) : job.status === 'completed' ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Clock className="h-3 w-3 text-yellow-500" />
                                                    )}
                                                    <span className="text-[11px] font-medium truncate max-w-[100px] uppercase font-mono tracking-tight text-[#a3a3a3]">
                                                        {job.column}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] px-1 py-0 border-transparent",
                                                    job.status === 'completed' ? "bg-green-500/10 text-green-500" :
                                                        job.status === 'running' ? "bg-primary/10 text-primary" : "bg-white/5 text-[#666666]"
                                                )}>
                                                    {job.status}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-[#666666]">
                                                    <span>Progress</span>
                                                    <span>{Math.round(job.progress)}%</span>
                                                </div>
                                                <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${job.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="filters" className="flex-1 px-4 pb-4 focus-visible:outline-none">
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-[#a3a3a3]">Quick Search</Label>
                            <Input
                                placeholder="Type to filter..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="bg-[#1a1a1a] border-[#333333] h-8 text-xs focus:ring-primary/20"
                            />
                        </div>
                        <Separator className="bg-[#262626]" />
                        <div className="space-y-3">
                            <Label className="text-xs text-[#a3a3a3]">Presets</Label>
                            <div className="grid gap-2">
                                {["High Confidence", "With Citations", "Missing Data"].map((f) => (
                                    <Button
                                        key={f}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-[11px] text-[#666666] hover:text-white hover:bg-white/5 h-8 gap-2"
                                    >
                                        <Filter className="h-3 w-3" />
                                        {f}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
