"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Webset } from "@/types/webset";
import { WebsetStatus } from "@/types/webset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock data - replace with actual API calls
const mockWebsets: Webset[] = [
  {
    id: "1",
    name: "Company Leads",
    description: "Top 100 SaaS companies with contact information",
    userId: "user-1",
    columnDefinitions: [
      { id: "company", name: "Company", type: "text" },
      { id: "website", name: "Website", type: "url" },
      { id: "email", name: "Email", type: "email" },
    ],
    status: WebsetStatus.ACTIVE,
    currentVersion: 3,
    rowCount: 100,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-01T14:30:00Z",
  },
  {
    id: "2",
    name: "Conference Speakers",
    description: "Tech conference speakers 2024",
    userId: "user-1",
    columnDefinitions: [
      { id: "name", name: "Name", type: "text" },
      { id: "linkedin", name: "LinkedIn", type: "url" },
      { id: "bio", name: "Bio", type: "text" },
    ],
    status: WebsetStatus.DRAFT,
    currentVersion: 1,
    rowCount: 45,
    createdAt: "2024-02-05T09:00:00Z",
    updatedAt: "2024-02-05T15:20:00Z",
  },
];

type ViewMode = "grid" | "list";

function getStatusColor(
  status: WebsetStatus,
): "success" | "secondary" | "outline" {
  switch (status) {
    case WebsetStatus.ACTIVE:
      return "success";
    case WebsetStatus.DRAFT:
      return "secondary";
    case WebsetStatus.ARCHIVED:
      return "outline";
    default:
      return "secondary";
  }
}

export default function WebsetsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [websets, setWebsets] = useState(mockWebsets);
  const [isLoading, setIsLoading] = useState(false);

  const filteredWebsets = websets.filter(
    (webset) =>
      webset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      webset.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this webset?")) {
      setWebsets(websets.filter((w) => w.id !== id));
    }
  };

  const handleArchive = (id: string) => {
    setWebsets(
      websets.map((w) =>
        w.id === id ? { ...w, status: WebsetStatus.ARCHIVED } : w,
      ),
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websets</h1>
          <p className="text-muted-foreground">
            Create and manage your data enrichment websets
          </p>
        </div>
        <Link href="/websets/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Webset
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search websets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div
          className={cn(
            "gap-6",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4",
          )}
        >
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWebsets.length === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No websets found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first webset to get started"}
              </p>
            </div>
            {!searchQuery && (
              <Link href="/websets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webset
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            "gap-6",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4",
          )}
        >
          {filteredWebsets.map((webset, index) => (
            <motion.div
              key={webset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <button
                      className="flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
                      onClick={() => router.push(`/websets/${webset.id}`)}
                      type="button"
                    >
                      <CardTitle className="truncate">{webset.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1.5">
                        {webset.description || "No description"}
                      </CardDescription>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/websets/${webset.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchive(webset.id)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(webset.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(webset.status)}>
                      {webset.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      v{webset.currentVersion}
                    </span>
                  </div>
                </CardHeader>
                <CardContent
                  onClick={() => router.push(`/websets/${webset.id}`)}
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="font-medium">{webset.rowCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Columns:</span>
                      <span className="font-medium">
                        {webset.columnDefinitions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">
                        {new Date(webset.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
