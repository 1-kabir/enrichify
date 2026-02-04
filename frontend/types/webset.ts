export enum WebsetStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived",
}

export interface ColumnDefinition {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: string;
}

export interface Webset {
    id: string;
    name: string;
    description?: string;
    userId: string;
    columnDefinitions: ColumnDefinition[];
    status: WebsetStatus;
    currentVersion: number;
    rowCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface WebsetCell {
    id: string;
    websetId: string;
    versionId?: string;
    row: number;
    column: string;
    value?: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
    citations?: WebsetCitation[];
    createdAt: string;
    updatedAt: string;
}

export interface WebsetCitation {
    id: string;
    cellId: string;
    url: string;
    title?: string;
    contentSnippet?: string;
    searchProviderId?: string;
    createdAt: string;
}

export interface WebsetVersion {
    id: string;
    websetId: string;
    version: number;
    data: Record<string, unknown>;
    changedBy: string;
    changeDescription?: string;
    createdAt: string;
}

export enum LLMProviderType {
    OPENAI = "openai",
    OPENAI_COMPATIBLE = "openai-compatible",
    CLAUDE = "claude",
    GEMINI = "gemini",
    GROQ = "groq",
    OPENROUTER = "openrouter",
    VERCEL_AI = "vercel-ai",
    MISTRAL = "mistral",
}

export enum SearchProviderType {
    EXA = "exa",
    BRAVE = "brave",
    BING = "bing",
    GOOGLE = "google",
    FIRECRAWL = "firecrawl",
    TAVILY = "tavily",
    SERPER = "serper",
    JINA = "jina",
    SEARXNG = "searxng",
}

export interface LLMProvider {
    id: string;
    name: string;
    type: LLMProviderType;
    endpoint?: string;
    isActive: boolean;
    config?: Record<string, unknown>;
    rateLimit?: number;
    dailyLimit?: number;
}

export interface SearchProvider {
    id: string;
    name: string;
    type: SearchProviderType;
    endpoint?: string;
    isActive: boolean;
    config?: Record<string, unknown>;
    rateLimit?: number;
    dailyLimit?: number;
}

export interface EnrichmentJob {
    id: string;
    websetId: string;
    column: string;
    rows: number[];
    status: "pending" | "running" | "completed" | "failed";
    progress: number;
    totalRows: number;
    completedRows: number;
    llmProviderId?: string;
    searchProviderId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExportFormat {
    type: "csv" | "xlsx" | "google-sheets";
    fileName?: string;
}

export interface CreateWebsetDto {
    name: string;
    description?: string;
    columnDefinitions: ColumnDefinition[];
    status?: WebsetStatus;
}

export interface UpdateWebsetDto {
    name?: string;
    description?: string;
    columnDefinitions?: ColumnDefinition[];
    status?: WebsetStatus;
}

export interface UpdateCellDto {
    row: number;
    column: string;
    value?: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
    changeDescription?: string;
}

export interface EnrichCellDto {
    websetId: string;
    column: string;
    rows: number[];
    prompt?: string;
    llmProviderId?: string;
    searchProviderId?: string;
}
export interface ExecutionPlan {
    name: string;
    description: string;
    columnDefinitions: {
        id: string;
        name: string;
        type: string;
        description: string;
    }[];
    estimatedResults: number;
    searchStrategy: string;
    steps: string[];
}
