import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Field {
  name: string;
  type: string;
}

interface CreateSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchemaCreated: () => void;
}

const FIELD_TYPES = [
  { value: "string",  label: "String" },
  { value: "number",  label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "email",   label: "Email" },
  { value: "url",     label: "URL" },
  { value: "date",    label: "Date" },
  { value: "phone",   label: "Phone" },
  { value: "address", label: "Address" },
];

const CreateSchemaDialog = ({ open, onOpenChange, onSchemaCreated }: CreateSchemaDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([{ name: "", type: "string" }]);

  const handleAddField = () => setFields([...fields, { name: "", type: "string" }]);

  const handleRemoveField = (index: number) =>
    setFields(fields.filter((_, i) => i !== index));

  const handleFieldChange = (index: number, key: keyof Field, value: string) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setFields([{ name: "", type: "string" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Error", description: "Schema name is required", variant: "destructive" });
      return;
    }

    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      toast({ title: "Error", description: "At least one field is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const schemaDefinition: Record<string, string> = {};
      validFields.forEach((f) => { schemaDefinition[f.name.trim()] = f.type; });

      const { data, error } = await supabase.functions.invoke("create-schema", {
        body: { name: name.trim(), description: description.trim(), schemaDefinition },
      });

      if (error) throw error;

      toast({
        title: "Schema created!",
        description: `Generated ${data.recordCount} mock records successfully.`,
      });

      resetForm();
      onSchemaCreated();
    } catch (error: any) {
      console.error("Error creating schema:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create schema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Schema</DialogTitle>
          <DialogDescription>
            Define your JSON schema fields and types. 10 realistic mock records will be generated instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Schema Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Users, Products, Orders"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this schema represents…"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Schema Fields *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddField} disabled={loading} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Input
                    className="flex-1"
                    placeholder="Field name (e.g., username, email, age)"
                    value={field.name}
                    onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                    disabled={loading}
                  />
                  <div className="w-36">
                    <Select
                      value={field.type}
                      onValueChange={(v) => handleFieldChange(index, "type", v)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onOpenChange(false); }}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Generating…" : "Create Schema"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSchemaDialog;
