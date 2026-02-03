"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreateWebsetDto, ColumnDefinition } from "@/types/webset";
import { WebsetStatus } from "@/types/webset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnEditor } from "@/components/websets/column-editor";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function NewWebsetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(
    null,
  );
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateWebsetDto>({
    name: "",
    description: "",
    columnDefinitions: [],
    status: WebsetStatus.DRAFT,
  });

  const handleAddColumn = () => {
    setEditingColumn(null);
    setEditingIndex(null);
    setIsColumnEditorOpen(true);
  };

  const handleEditColumn = (column: ColumnDefinition, index: number) => {
    setEditingColumn(column);
    setEditingIndex(index);
    setIsColumnEditorOpen(true);
  };

  const handleSaveColumn = (column: ColumnDefinition) => {
    if (editingIndex !== null) {
      const newColumns = [...formData.columnDefinitions];
      newColumns[editingIndex] = column;
      setFormData({ ...formData, columnDefinitions: newColumns });
    } else {
      setFormData({
        ...formData,
        columnDefinitions: [...formData.columnDefinitions, column],
      });
    }
    setIsColumnEditorOpen(false);
  };

  const handleDeleteColumn = (index: number) => {
    if (confirm("Are you sure you want to delete this column?")) {
      setFormData({
        ...formData,
        columnDefinitions: formData.columnDefinitions.filter(
          (_, i) => i !== index,
        ),
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a webset name");
      return;
    }
    if (formData.columnDefinitions.length === 0) {
      alert("Please add at least one column");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      console.log("Creating webset:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/websets");
    } catch (error) {
      console.error("Error creating webset:", error);
      alert("Failed to create webset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Webset</h1>
        <p className="text-muted-foreground mt-2">
          Set up your webset structure and start enriching data
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide a name and description for your webset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Company Leads"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Describe what this webset is for..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: WebsetStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WebsetStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={WebsetStatus.ACTIVE}>Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Columns</CardTitle>
                <CardDescription>
                  Define the columns for your webset
                </CardDescription>
              </div>
              <Button onClick={handleAddColumn} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.columnDefinitions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No columns defined yet
                </p>
                <Button onClick={handleAddColumn} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Column
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.columnDefinitions.map((column, index) => (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium">{column.name}</span>
                      <Badge variant="secondary">{column.type}</Badge>
                      {column.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditColumn(column, index)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteColumn(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.name ||
              formData.columnDefinitions.length === 0
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Webset"}
          </Button>
        </div>
      </div>

      <ColumnEditor
        column={editingColumn}
        isOpen={isColumnEditorOpen}
        onClose={() => {
          setIsColumnEditorOpen(false);
          setEditingColumn(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveColumn}
        onDelete={
          editingIndex !== null
            ? () => {
                handleDeleteColumn(editingIndex);
                setIsColumnEditorOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
