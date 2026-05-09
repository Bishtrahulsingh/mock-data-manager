import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Schema {
  id: string;
  name: string;
  description: string | null;
  schema_definition: Record<string, string>;
  api_endpoint: string;
  created_at: string;
}

interface DataRecord {
  id: string;
  data: Record<string, unknown>;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiUrl = `${supabaseUrl}/functions/v1/data-crud?schemaId=${schema.id}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("generated_data")
        .select("*")
        .eq("schema_id", schema.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData((records as DataRecord[]) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [schema.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    toast({ title: "Copied!", description: "API endpoint copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("generated_data")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Record deleted." });
      setData((prev) => prev.filter((r) => r.id !== id));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const samplePost = JSON.stringify(
    Object.fromEntries(
      Object.entries(schema.schema_definition).map(([k, v]) => [k, `<${v}>`])
    ),
    null,
    2
  );

  const apiDocs = `# ${schema.name} API

Base URL:
  ${apiUrl}

All requests require:
  Authorization: Bearer <your-jwt-token>

─────────────────────────────────────────────
GET  all records
─────────────────────────────────────────────
curl "${apiUrl}"

─────────────────────────────────────────────
GET  single record
─────────────────────────────────────────────
curl "${apiUrl}&dataId=<record-id>"

─────────────────────────────────────────────
POST  create a record
─────────────────────────────────────────────
curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"data": ${samplePost}}'

─────────────────────────────────────────────
PUT  update a record
─────────────────────────────────────────────
curl -X PUT "${apiUrl}&dataId=<record-id>" \\
  -H "Content-Type: application/json" \\
  -d '{"data": ${samplePost}}'

─────────────────────────────────────────────
DELETE  a record
─────────────────────────────────────────────
curl -X DELETE "${apiUrl}&dataId=<record-id>"

─────────────────────────────────────────────
Schema definition
─────────────────────────────────────────────
${JSON.stringify(schema.schema_definition, null, 2)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{schema.name}</h2>
          {schema.description && (
            <p className="text-sm text-muted-foreground">{schema.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">
            Data {!loading && `(${data.length})`}
          </TabsTrigger>
          <TabsTrigger value="api">API Docs</TabsTrigger>
        </TabsList>

        {/* ── Data tab ─────────────────────────────────────────────── */}
        <TabsContent value="data" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : data.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground">No records found.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {data.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {record.id.slice(0, 8)}…
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-sm font-mono leading-relaxed">
                    {JSON.stringify(record.data, null, 2)}
                  </pre>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── API Docs tab ─────────────────────────────────────────── */}
        <TabsContent value="api" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Endpoint URL</h3>
              <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <code className="block bg-muted/50 p-3 rounded-md text-sm font-mono break-all">
              {apiUrl}
            </code>
          </Card>

          <Card className="p-6">
            <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre leading-relaxed">
              {apiDocs}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchemaDataViewer;
