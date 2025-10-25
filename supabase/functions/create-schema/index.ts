import 'dotenv/config';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HuggingFaceInference } from "https://esm.sh/langchain@0.1.25/llms/hf";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, description, schemaDefinition } = await req.json();
    const apiEndpoint = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const HF_API_KEY = process.env.HUGGINGFACEAPIKEY;
    if (!HF_API_KEY) throw new Error('Missing HUGGINGFACE_API_KEY');

    const model = new HuggingFaceInference({
      apiKey: HF_API_KEY,
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      temperature: 0.7,
      maxTokens: 2048,
    });

    const schemaFields = JSON.stringify(schemaDefinition, null, 2);
    const prompt = `
You are a mock data generation expert.
Generate exactly 10 diverse, realistic records matching this JSON schema:

${schemaFields}

Guidelines:
- Respect field data types
- Create believable, varied, human-like values
- No explanations or markdown
- Return ONLY a valid JSON array of objects
`;

    console.log("Calling Hugging Face model...");

    const aiResponse = await model.invoke(prompt);
    let generatedDataText = aiResponse.trim();

    generatedDataText = generatedDataText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let generatedData;
    try {
      generatedData = JSON.parse(generatedDataText);
    } catch (err) {
      console.error("Invalid JSON from model:", generatedDataText);
      throw new Error("Model returned invalid JSON format");
    }

    if (!Array.isArray(generatedData) || generatedData.length === 0) {
      throw new Error("AI did not generate valid data array");
    }

    const { data: schema, error: schemaError } = await supabaseClient
      .from("schemas")
      .insert({
        user_id: user.id,
        name,
        description,
        schema_definition: schemaDefinition,
        api_endpoint: apiEndpoint,
      })
      .select()
      .single();

    if (schemaError) throw schemaError;

    const records = generatedData.map((r: any) => ({
      schema_id: schema.id,
      data: r,
    }));

    const { error: dataError } = await supabaseClient
      .from("generated_data")
      .insert(records);
 
    if (dataError) throw dataError;

    console.log(`Created schema ${schema.id} with ${generatedData.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        schema,
        recordCount: generatedData.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
