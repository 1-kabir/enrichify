"use client";

import { useState } from "react";
import type { ColumnDefinition } from "@/types/webset";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ColumnEditorProps {
  column: ColumnDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: ColumnDefinition) => void;
  onDelete?: () => void;
}

const COLUMN_TYPES = ["text", "number", "url", "email", "date", "boolean"];

export function ColumnEditor({
  column,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ColumnEditorProps) {
  const [formData, setFormData] = useState<ColumnDefinition>(
    column || {
      id: crypto.randomUUID(),
      name: "",
      type: "text",
      required: false,
    },
  );

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Column name is required");
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{column ? "Edit Column" : "Add Column"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Column Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Default Value (Optional)</Label>
            <Input
              id="defaultValue"
              value={formData.defaultValue || ""}
              onChange={(e) =>
                setFormData({ ...formData, defaultValue: e.target.value })
              }
              placeholder="Default value for new rows"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="required">Required</Label>
            <Switch
              id="required"
              checked={formData.required || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, required: checked })
              }
            />
          </div>
        </div>
        <DialogFooter>
          {column && onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{column ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
