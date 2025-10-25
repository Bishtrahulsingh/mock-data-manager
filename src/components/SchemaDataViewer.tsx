import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Schema {
  id: string;
  name: string;
  description: string;
  schema_definition: any;
  api_endpoint: string;
  created_at: string;
}

interface DataRecord {
  id: string;
  data: any;
  created_at: string;
}

interface SchemaDataViewerProps {
  schema: Schema;
  onBack: () => void;
}

const SchemaDataViewer = ({ schema, onBack }: SchemaDataViewerProps) => {
  const { toast } = useToast();
  const [data, setData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-crud?schemaId=${schema.id}`;

  const fetchData = async () => {
    try {
      const { data: records, error } = await supabase
        .from("generated_data")
        .select("*")
        .eq("schema_id", schema.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(records || []);
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
    fetchData();
  }, [schema.id]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "API endpoint copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_data")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const apiDocs = `
# ${schema.name} API Documentation

Base URL: ${apiUrl}

## Endpoints

### GET - Fetch all records
\`\`\`bash
curl "${apiUrl}"
\`\`\`

### GET - Fetch single record
\`\`\`bash
curl "${apiUrl}&dataId={id}"
\`\`\`

### POST - Create new record
\`\`\`bash
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"data": ${JSON.stringify(schema.schema_definition, null, 2)}}'
\`\`\`

### PUT - Update record
\`\`\`bash
curl -X PUT "${apiUrl}&dataId={id}" \\
  -H "Content-Type: application/json" \\
  -d '{"data": ${JSON.stringify(schema.schema_definition, null, 2)}}'
\`\`\`

### DELETE - Delete record
\`\`\`bash
curl -X DELETE "${apiUrl}&dataId={id}"
\`\`\`

## Schema Definition
${JSON.stringify(schema.schema_definition, null, 2)}
  `.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{schema.name}</h2>
          <p className="text-sm text-muted-foreground">{schema.description}</p>
        </div>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Data ({data.length})</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="font-mono text-xs">
                      ID: {record.id.slice(0, 8)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-sm font-mono">
                    {JSON.stringify(record.data, null, 2)}
                  </pre>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">API Endpoint</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            </div>
            <code className="block bg-muted/50 p-3 rounded-md text-sm font-mono break-all">
              {apiUrl}
            </code>
          </Card>

          <Card className="p-6">
            <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {apiDocs}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchemaDataViewer;