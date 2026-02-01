"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@/types/webset";
import { WebsetTable } from "@/components/websets/webset-table";
import { WebsetToolbar } from "@/components/websets/webset-toolbar";
import { WebsetSidebar } from "@/components/websets/webset-sidebar";
import { ColumnEditor } from "@/components/websets/column-editor";
import { ProviderSelector } from "@/components/websets/provider-selector";
import { EnrichmentDialog } from "@/components/websets/enrichment-dialog";
import { EnrichmentProgress } from "@/components/websets/enrichment-progress";
import { ExportDialog } from "@/components/websets/export-dialog";
import { VersionHistory } from "@/components/websets/version-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

// Mock data
const mockWebset: Webset = {
  id: "1",
  name: "Company Leads",
  description: "Top 100 SaaS companies with contact information",
  userId: "user-1",
  columnDefinitions: [
    { id: "company", name: "Company", type: "text", required: true },
    { id: "website", name: "Website", type: "url" },
    { id: "email", name: "Email", type: "email" },
    { id: "linkedin", name: "LinkedIn", type: "url" },
  ],
  status: "active" as any,
  currentVersion: 3,
  rowCount: 10,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-02-01T14:30:00Z",
};

const mockCells: WebsetCell[] = [
  {
    id: "1",
    websetId: "1",
    row: 0,
    column: "company",
    value: "Acme Corp",
    confidenceScore: 0.95,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    websetId: "1",
    row: 0,
    column: "website",
    value: "https://acme.com",
    confidenceScore: 1.0,
    citations: [
      {
        id: "c1",
        cellId: "2",
        url: "https://acme.com",
        title: "Acme Corp Official Website",
        createdAt: "2024-01-15T10:00:00Z",
      },
    ],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "3",
    websetId: "1",
    row: 1,
    column: "company",
    value: "TechStart Inc",
    confidenceScore: 0.88,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
];

const mockLLMProviders: LLMProvider[] = [
  {
    id: "llm-1",
    name: "GPT-4",
    type: "openai" as any,
    isActive: true,
  },
  {
    id: "llm-2",
    name: "Claude 3",
    type: "claude" as any,
    isActive: true,
  },
];

const mockSearchProviders: SearchProvider[] = [
  {
    id: "search-1",
    name: "Exa",
    type: "exa" as any,
    isActive: true,
  },
  {
    id: "search-2",
    name: "Brave Search",
    type: "brave" as any,
    isActive: true,
  },
];

export default function WebsetPage() {
  const params = useParams();
  const router = useRouter();
  const websetId = params?.id as string;

  const [webset, setWebset] = useState<Webset | null>(null);
  const [cells, setCells] = useState<WebsetCell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [enrichmentJobs, setEnrichmentJobs] = useState<EnrichmentJob[]>([]);

  // Dialog states
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(
    null,
  );
  const [isProviderSelectorOpen, setIsProviderSelectorOpen] = useState(false);
  const [isEnrichmentDialogOpen, setIsEnrichmentDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const [selectedLLM, setSelectedLLM] = useState<string | undefined>();
  const [selectedSearch, setSelectedSearch] = useState<string | undefined>();
  const [enrichColumn, setEnrichColumn] = useState<string>("");

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setWebset(mockWebset);
      setCells(mockCells);
      setVisibleColumns(mockWebset.columnDefinitions.map((c) => c.id));
      setEditedName(mockWebset.name);
      setIsLoading(false);
    }, 500);
  }, [websetId]);

  const handleCellUpdate = async (
    row: number,
    column: string,
    value: string,
    confidenceScore?: number,
  ) => {
    // TODO: API call to update cell
    console.log("Updating cell:", { row, column, value, confidenceScore });

    const cellIndex = cells.findIndex(
      (c) => c.row === row && c.column === column,
    );
    if (cellIndex >= 0) {
      const updatedCells = [...cells];
      updatedCells[cellIndex] = {
        ...updatedCells[cellIndex],
        value,
        confidenceScore,
        updatedAt: new Date().toISOString(),
      };
      setCells(updatedCells);
    } else {
      // Create new cell
      const newCell: WebsetCell = {
        id: crypto.randomUUID(),
        websetId: websetId,
        row,
        column,
        value,
        confidenceScore,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCells([...cells, newCell]);
    }
  };

  const handleAddColumn = (column: ColumnDefinition) => {
    if (!webset) return;
    setWebset({
      ...webset,
      columnDefinitions: [...webset.columnDefinitions, column],
    });
    setVisibleColumns([...visibleColumns, column.id]);
  };

  const handleEditColumn = (column: ColumnDefinition) => {
    setEditingColumn(column);
    setIsColumnEditorOpen(true);
  };

  const handleSaveColumn = (column: ColumnDefinition) => {
    if (!webset) return;
    const index = webset.columnDefinitions.findIndex((c) => c.id === column.id);
    if (index >= 0) {
      const newColumns = [...webset.columnDefinitions];
      newColumns[index] = column;
      setWebset({ ...webset, columnDefinitions: newColumns });
    }
  };

  const handleToggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId],
    );
  };

  const handleEnrichClick = () => {
    if (selectedRows.length === 0) {
      alert("Please select rows to enrich");
      return;
    }
    setIsProviderSelectorOpen(true);
  };

  const handleProviderSelect = (llmId?: string, searchId?: string) => {
    setSelectedLLM(llmId);
    setSelectedSearch(searchId);
    setIsProviderSelectorOpen(false);

    // For now, enrich first visible column
    const firstColumn = webset?.columnDefinitions.find((c) =>
      visibleColumns.includes(c.id),
    );
    if (firstColumn) {
      setEnrichColumn(firstColumn.id);
      setIsEnrichmentDialogOpen(true);
    }
  };

  const handleEnrich = (dto: EnrichCellDto) => {
    // TODO: API call to start enrichment
    console.log("Starting enrichment:", dto);

    const newJob: EnrichmentJob = {
      id: crypto.randomUUID(),
      websetId: dto.websetId,
      column: dto.column,
      rows: dto.rows,
      status: "running",
      progress: 0,
      totalRows: dto.rows.length,
      completedRows: 0,
      llmProviderId: dto.llmProviderId,
      searchProviderId: dto.searchProviderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEnrichmentJobs([...enrichmentJobs, newJob]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      if (progress >= 1) {
        clearInterval(interval);
        setEnrichmentJobs((jobs) =>
          jobs.map((j) =>
            j.id === newJob.id
              ? {
                  ...j,
                  status: "completed",
                  progress: 1,
                  completedRows: j.totalRows,
                }
              : j,
          ),
        );
      } else {
        setEnrichmentJobs((jobs) =>
          jobs.map((j) =>
            j.id === newJob.id
              ? {
                  ...j,
                  progress,
                  completedRows: Math.floor(progress * j.totalRows),
                }
              : j,
          ),
        );
      }
    }, 500);
  };

  const handleExport = async (format: ExportFormat) => {
    // TODO: API call to export
    console.log("Exporting:", format);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleAddRow = () => {
    if (!webset) return;
    setWebset({ ...webset, rowCount: webset.rowCount + 1 });
  };

  const handleSaveName = () => {
    if (!webset) return;
    setWebset({ ...webset, name: editedName });
    setIsEditingName(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!webset) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Webset not found</h2>
        <Button onClick={() => router.push("/websets")}>Back to Websets</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/websets")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditedName(webset.name);
                    setIsEditingName(false);
                  }
                }}
              />
              <Button size="sm" onClick={handleSaveName}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditedName(webset.name);
                  setIsEditingName(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold">{webset.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <WebsetToolbar
            onExport={() => setIsExportDialogOpen(true)}
            onShare={() => alert("Share feature coming soon")}
            onVersionHistory={() => setIsVersionHistoryOpen(true)}
            onEnrich={handleEnrichClick}
            onAddRow={handleAddRow}
            hasSelectedRows={selectedRows.length > 0}
          />
          <div className="flex-1 overflow-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {enrichmentJobs.length > 0 && (
                <EnrichmentProgress jobs={enrichmentJobs} />
              )}
              <WebsetTable
                columns={webset.columnDefinitions}
                cells={cells}
                rowCount={webset.rowCount}
                visibleColumns={visibleColumns}
                onCellUpdate={handleCellUpdate}
                onRowSelect={setSelectedRows}
              />
            </motion.div>
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
        />
      </div>

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
        llmProviders={mockLLMProviders}
        searchProviders={mockSearchProviders}
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
        websetName={webset.name}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={handleExport}
      />

      <VersionHistory
        versions={[]}
        currentVersion={webset.currentVersion}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestore={(versionId) => {
          console.log("Restoring version:", versionId);
          setIsVersionHistoryOpen(false);
        }}
      />
    </div>
  );
}
