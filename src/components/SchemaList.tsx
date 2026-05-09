import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import SchemaDataViewer from "./SchemaDataViewer";

interface Schema {
  id: string;
  name: string;
  description: string | null;
  schema_definition: Record<string, string>;
  api_endpoint: string;
  created_at: string;
}

interface SchemaListProps {
  refreshKey?: number;
}

const SchemaList = ({ refreshKey = 0 }: SchemaListProps) => {
  const { toast } = useToast();
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("schemas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSchemas((data as Schema[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("schemas").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Schema deleted successfully." });
      setSchemas((prev) => prev.filter((s) => s.id !== id));
      if (selectedSchema?.id === id) setSelectedSchema(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (selectedSchema) {
    return (
      <SchemaDataViewer
        schema={selectedSchema}
        onBack={() => setSelectedSchema(null)}
      />
    );
  }

  if (schemas.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Code2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No schemas yet</h3>
        <p className="text-muted-foreground">
          Create your first schema to start generating mock data.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schemas.map((schema) => {
        const fieldKeys = Object.keys(schema.schema_definition);
        return (
          <Card
            key={schema.id}
            className="p-6 hover:border-primary/50 transition-all hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{schema.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(schema.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(schema.id)}
                disabled={deletingId === schema.id}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {schema.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {schema.description}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {fieldKeys.length} field{fieldKeys.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1">
                  {fieldKeys.slice(0, 4).map((field) => (
                    <Badge key={field} variant="secondary" className="text-xs font-mono">
                      {field}
                    </Badge>
                  ))}
                  {fieldKeys.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{fieldKeys.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <Button
                  onClick={() => setSelectedSchema(schema)}
                  className="w-full gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Data & API
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SchemaList;
