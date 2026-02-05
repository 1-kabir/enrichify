"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type {
    Webset,
    WebsetCell,
    ColumnDefinition,
    LLMProvider,
    SearchProvider,
    EnrichmentJob,
    ExportFormat,
    EnrichCellDto,
    WebsetVersion,
    ExecutionPlan,
} from "@/types/webset";
import { WebsetStatus, LLMProviderType, SearchProviderType } from "@/types/webset";
import { WebsetTable } from "@/components/websets/webset-table";
import { WebsetToolbar } from "@/components/websets/webset-toolbar";
import { WebsetSidebar } from "@/components/websets/webset-sidebar";
import { ColumnEditor } from "@/components/websets/column-editor";
import { ProviderSelector } from "@/components/websets/provider-selector";
import { EnrichmentDialog } from "@/components/websets/enrichment-dialog";
import { EnrichmentProgress } from "@/components/websets/enrichment-progress";
import { ExportDialog } from "@/components/websets/export-dialog";
import { VersionHistory } from "@/components/websets/version-history";
import { PlanningPhase } from "@/components/websets/planning-phase";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit2, Share2, History, Wand2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WebsetPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const websetId = params?.id as string;

    const [webset, setWebset] = useState<Webset | null>(null);
    const [cells, setCells] = useState<WebsetCell[]>([]);
    const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([]);
    const [searchProviders, setSearchProviders] = useState<SearchProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlanning, setIsPlanning] = useState(false);

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");

    // Selection and Visibility
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [enrichmentJobs, setEnrichmentJobs] = useState<EnrichmentJob[]>([]);

    // Dialog states
    const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
    const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
    const [isEnrichmentDialogOpen, setIsEnrichmentDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
    const [versions, setVersions] = useState<WebsetVersion[]>([]);

    // Active enrichment states
    const [selectedLLM, setSelectedLLM] = useState<string | undefined>();
    const [selectedSearch, setSelectedSearch] = useState<string | undefined>();
    const [enrichColumn, setEnrichColumn] = useState<string>("");

    useEffect(() => {
        let isMounted = true;

        const fetchWebsetData = async () => {
            try {
                setIsLoading(true);
                const [websetRes, cellsRes, llmRes, searchRes] = await Promise.all([
                    api.get(`/websets/${websetId}`),
                    api.get(`/websets/${websetId}/cells`),
                    api.get('/providers/llm'),
                    api.get('/providers/search'),
                ]);

                if (isMounted) {
                    setWebset(websetRes.data);
                    setCells(cellsRes.data);
                    setLlmProviders(llmRes.data);
                    setSearchProviders(searchRes.data);
                    setVisibleColumns(websetRes.data.columnDefinitions.map((c: ColumnDefinition) => c.id));
                    setEditedName(websetRes.data.name);

                    // Detect if we need planning phase
                    if (websetRes.data.status === WebsetStatus.DRAFT && websetRes.data.columnDefinitions.length === 0) {
                        setIsPlanning(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch webset data:", error);
                toast({
                    title: "Connection Error",
                    description: "Could not load webset data.",
                    variant: "destructive"
                });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (websetId) {
            fetchWebsetData();
        }

        // Socket.io integration
        const getSocketUrl = () => {
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3132"}/enrichment`;
            }
            return `${window.location.origin}/enrichment`;
        };

        const socket = io(getSocketUrl(), {
            auth: { token: localStorage.getItem("auth_token") }
        });

        socket.on(`progress:${websetId}`, (data) => {
            setEnrichmentJobs(prev => {
                const existing = prev.find(j => j.id === data.jobId);
                if (existing) {
                    return prev.map(j => j.id === data.jobId ? { ...j, ...data } : j);
                }
                return [...prev, { id: data.jobId, ...data }];
            });
        });

        socket.on(`cell:updated:${websetId}`, (updatedCell) => {
            setCells(prev => {
                const idx = prev.findIndex(c => c.id === updatedCell.id || (c.row === updatedCell.row && c.column === updatedCell.column));
                if (idx >= 0) {
                    const newCells = [...prev];
                    newCells[idx] = updatedCell;
                    return newCells;
                }
                return [...prev, updatedCell];
            });
        });

        return () => {
            isMounted = false;
            socket.disconnect();
        };
    }, [websetId]);

    // Fetch versions when version history dialog is opened
    useEffect(() => {
        if (isVersionHistoryOpen && websetId) {
            const fetchVersions = async () => {
                try {
                    const response = await api.get(`/websets/${websetId}/versions`);
                    setVersions(response.data);
                } catch (error) {
                    console.error("Failed to fetch versions:", error);
                    toast({
                        title: "Error",
                        description: "Could not load version history.",
                        variant: "destructive"
                    });
                }
            };

            fetchVersions();
        }
    }, [isVersionHistoryOpen, websetId]);

    const handleApprovePlan = async (plan: ExecutionPlan) => {
        try {
            setIsLoading(true);
            const updatedWebsetRes = await api.patch(`/websets/${websetId}`, {
                name: plan.name,
                description: plan.description,
                columnDefinitions: plan.columnDefinitions.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    required: false
                })),
                status: WebsetStatus.ACTIVE
            });

            setWebset(updatedWebsetRes.data);
            setVisibleColumns(plan.columnDefinitions.map(c => c.id));
            setIsPlanning(false);

            toast({
                title: "Mission Launched",
                description: "The agent swarm has been initialized.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to initialize webset.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCellUpdate = async (row: number, column: string, value: string, confidenceScore?: number) => {
        try {
            const response = await api.patch(`/websets/${websetId}/cells`, {
                row,
                column,
                value,
                confidenceScore
            });

            const updatedCell = response.data;
            setCells(prev => {
                const idx = prev.findIndex(c => c.row === row && c.column === column);
                if (idx >= 0) {
                    const newCells = [...prev];
                    newCells[idx] = updatedCell;
                    return newCells;
                }
                return [...prev, updatedCell];
            });
        } catch (error) {
            console.error("Failed to update cell:", error);
        }
    };

    const handleAddColumn = async (column: ColumnDefinition) => {
        if (!webset) return;
        try {
            const updatedColumns = [...webset.columnDefinitions, column];
            const response = await api.patch(`/websets/${websetId}`, {
                columnDefinitions: updatedColumns
            });
            setWebset(response.data);
            setVisibleColumns([...visibleColumns, column.id]);
        } catch (error) {
            console.error("Failed to add column:", error);
        }
    };

    const handleEditColumn = (column: ColumnDefinition) => {
        setEditingColumn(column);
        setIsColumnEditorOpen(true);
    };

    const handleSaveColumn = async (column: ColumnDefinition) => {
        if (!webset) return;
        try {
            const index = webset.columnDefinitions.findIndex((c) => c.id === column.id);
            if (index >= 0) {
                const newColumns = [...webset.columnDefinitions];
                newColumns[index] = column;
                const response = await api.patch(`/websets/${websetId}`, {
                    columnDefinitions: newColumns
                });
                setWebset(response.data);
            }
        } catch (error) {
            console.error("Failed to save column:", error);
        }
    };

    const handleToggleColumn = (columnId: string) => {
        setVisibleColumns((prev) =>
            prev.includes(columnId)
                ? prev.filter((id) => id !== columnId)
                : [...prev, columnId]
        );
    };

    const handleEnrichClick = () => {
        if (selectedRows.length === 0) {
            toast({
                title: "No rows selected",
                description: "Please select at least one row to enrich.",
                variant: "destructive"
            });
            return;
        }
        setIsProviderSelectorOpen(true);
    };

    const handleProviderSelect = (llmId?: string, searchId?: string) => {
        setSelectedLLM(llmId);
        setSelectedSearch(searchId);
        setIsProviderSelectorOpen(false);

        const targetColumn = webset?.columnDefinitions.find(c => visibleColumns.includes(c.id));
        if (targetColumn) {
            setEnrichColumn(targetColumn.id);
            setIsEnrichmentDialogOpen(true);
        }
    };

    const handleEnrich = async (dto: EnrichCellDto) => {
        try {
            await api.post("/enrichment/enrich", dto);
            toast({
                title: "Enrichment started",
                description: `Processing ${dto.rows.length} rows for "${dto.column}"`,
            });
        } catch (error) {
            console.error("Failed to start enrichment:", error);
            toast({
                title: "Enrichment failed",
                description: "Could not start the enrichment job.",
                variant: "destructive"
            });
        }
    };

    const handleExport = async (format: ExportFormat) => {
        console.log("Exporting:", format);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        toast({ title: "Export successful", description: `File ready for download: ${format.type}` });
    };

    const handleAddRow = () => {
        if (!webset) return;
        setWebset({ ...webset, rowCount: webset.rowCount + 1 });
    };

    const handleSaveName = async () => {
        if (!webset) return;
        try {
            const res = await api.patch(`/websets/${websetId}`, { name: editedName });
            setWebset(res.data);
            setIsEditingName(false);
            toast({ title: "Name updated" });
        } catch (error) {
            toast({ title: "Failed to update name", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="p-8 space-y-6">
                        <Skeleton className="h-10 w-64 bg-white/5" />
                        <Skeleton className="h-[500px] w-full bg-white/5 rounded-2xl" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (!webset) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                        <h2 className="text-2xl font-bold text-white">Webset not found</h2>
                        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (isPlanning) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <PlanningPhase
                        webset={webset}
                        onApproved={handleApprovePlan}
                        onEditPrompt={() => router.push('/dashboard')}
                    />
                </AppLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="h-full flex flex-col bg-[#0d0d0d]">
                    {/* Header */}
                    <div className="border-b border-[#262626] p-4 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-10 transition-all duration-300">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push("/dashboard")}
                                    className="text-[#a3a3a3] hover:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                                <div className="h-4 w-[1px] bg-[#262626]" />
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="h-9 w-64 bg-[#1a1a1a] border-[#333333] text-white focus:border-primary/50"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveName();
                                                if (e.key === "Escape") {
                                                    setEditedName(webset.name);
                                                    setIsEditingName(false);
                                                }
                                            }}
                                        />
                                        <Button size="sm" onClick={handleSaveName} className="bg-primary hover:bg-primary/90">Save</Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditedName(webset.name);
                                                setIsEditingName(false);
                                            }}
                                            className="text-[#a3a3a3]"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 group px-2 py-1 -ml-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setIsEditingName(true)}>
                                        <h1 className="text-xl font-bold text-white tracking-tight">{webset.name}</h1>
                                        <Edit2 className="h-3.5 w-3.5 text-[#666666] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="text-[#a3a3a3] hover:text-white gap-2" onClick={() => setIsVersionHistoryOpen(true)}>
                                    <History className="h-4 w-4" />
                                    <span className="hidden sm:inline">History</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-[#a3a3a3] hover:text-white gap-2">
                                    <Share2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Share</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <WebsetToolbar
                                onExport={() => setIsExportDialogOpen(true)}
                                onShare={() => toast({ title: "Coming soon" })}
                                onVersionHistory={() => setIsVersionHistoryOpen(true)}
                                onEnrich={handleEnrichClick}
                                onAddRow={handleAddRow}
                                hasSelectedRows={selectedRows.length > 0}
                            />
                            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={websetId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        {enrichmentJobs.length > 0 && (
                                            <EnrichmentProgress 
                                                jobs={enrichmentJobs} 
                                                onJobUpdate={() => {
                                                    // Refresh job status by re-fetching if needed
                                                    // For now, we rely on socket updates
                                                }} 
                                            />
                                        )}
                                        <div className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden shadow-2xl">
                                            <WebsetTable
                                                columns={webset.columnDefinitions}
                                                cells={cells}
                                                rowCount={webset.rowCount}
                                                visibleColumns={visibleColumns}
                                                onCellUpdate={handleCellUpdate}
                                                onRowSelect={setSelectedRows}
                                            />
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        <WebsetSidebar
                            columns={webset.columnDefinitions}
                            onAddColumn={() => {
                                setEditingColumn(null);
                                setIsColumnEditorOpen(true);
                            }}
                            onEditColumn={handleEditColumn}
                            visibleColumns={visibleColumns}
                            onToggleColumn={handleToggleColumn}
                            jobs={enrichmentJobs}
                        />
                    </div>

                    {/* Dialogs */}
                    <ColumnEditor
                        column={editingColumn}
                        isOpen={isColumnEditorOpen}
                        onClose={() => {
                            setIsColumnEditorOpen(false);
                            setEditingColumn(null);
                        }}
                        onSave={(column) => {
                            if (editingColumn) {
                                handleSaveColumn(column);
                            } else {
                                handleAddColumn(column);
                            }
                            setIsColumnEditorOpen(false);
                        }}
                    />

                    <ProviderSelector
                        llmProviders={llmProviders}
                        searchProviders={searchProviders}
                        selectedLLM={selectedLLM}
                        selectedSearch={selectedSearch}
                        onSelect={handleProviderSelect}
                        isOpen={isProviderSelectorOpen}
                        onClose={() => setIsProviderSelectorOpen(false)}
                    />

                    <EnrichmentDialog
                        websetId={websetId}
                        columnName={enrichColumn}
                        selectedRows={selectedRows}
                        llmProviderId={selectedLLM}
                        searchProviderId={selectedSearch}
                        isOpen={isEnrichmentDialogOpen}
                        onClose={() => setIsEnrichmentDialogOpen(false)}
                        onEnrich={handleEnrich}
                    />

                    <ExportDialog
                        websetId={websetId}
                        websetName={webset.name}
                        isOpen={isExportDialogOpen}
                        onClose={() => setIsExportDialogOpen(false)}
                    />

                    <VersionHistory
                        versions={versions}
                        currentVersion={webset.currentVersion}
                        isOpen={isVersionHistoryOpen}
                        onClose={() => setIsVersionHistoryOpen(false)}
                        onRestore={async (versionId) => {
                            try {
                                await api.post(`/websets/${websetId}/revert`, {
                                    versionId: versionId,
                                    changeDescription: `Restored to version ${versionId}`
                                });
                                toast({
                                    title: "Version restored",
                                    description: "The webset has been restored to the selected version."
                                });
                                // Refresh the page to show the restored data
                                router.refresh();
                            } catch (error) {
                                toast({
                                    title: "Error",
                                    description: "Could not restore the version.",
                                    variant: "destructive"
                                });
                            }
                        }}
                    />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
