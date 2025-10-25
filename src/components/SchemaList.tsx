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
  description: string;
  schema_definition: any;
  api_endpoint: string;
  created_at: string;
}

const SchemaList = () => {
  const { toast } = useToast();
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

  const fetchSchemas = async () => {
    try {
      const { data, error } = await supabase
        .from("schemas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSchemas(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("schemas").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schema deleted successfully",
      });
      fetchSchemas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getApiUrl = (endpoint: string) => {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-crud?schemaId=${endpoint}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Code2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No schemas yet</h3>
        <p className="text-muted-foreground">
          Create your first schema to get started with mock data generation
        </p>
      </Card>
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schemas.map((schema) => (
        <Card key={schema.id} className="p-6 hover:border-primary/50 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{schema.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(schema.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(schema.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {schema.description && (
            <p className="text-sm text-muted-foreground mb-4">{schema.description}</p>
          )}

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Schema Fields</p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(schema.schema_definition).slice(0, 4).map((field) => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {Object.keys(schema.schema_definition).length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{Object.keys(schema.schema_definition).length - 4}
                  </Badge>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
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
      ))}
    </div>
  );
};

export default SchemaList;