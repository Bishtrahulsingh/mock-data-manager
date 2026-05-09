import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Built-in fake data generators ──────────────────────────────────────────

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST_NAMES = ["Alice","Bob","Carlos","Diana","Ethan","Fatima","George","Hannah","Ivan","Julia","Kevin","Laura","Mohammed","Nina","Oscar","Priya","Quinn","Rosa","Samuel","Tina","Umar","Vera","William","Xena","Yusuf","Zara"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Martinez","Wilson","Anderson","Taylor","Thomas","Jackson","White","Harris","Martin","Thompson","Lee","Walker","Hall","Allen","Young","King","Wright","Scott"];
const DOMAINS     = ["gmail.com","yahoo.com","outlook.com","company.io","work.co","mail.com","proton.me","example.org"];
const COMPANIES   = ["Acme Corp","Globex","Initech","Umbrella Ltd","Hooli","Pied Piper","Dunder Mifflin","Stark Industries","Wayne Enterprises","Oscorp","Cyberdyne","Soylent Corp","Veridian Dynamics","Massive Dynamic"];
const CITIES      = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","London","Toronto","Sydney","Tokyo","Berlin","Paris","Mumbai","Singapore","Dubai","São Paulo"];
const STREETS     = ["Main St","Oak Ave","Maple Rd","Cedar Blvd","Pine Lane","Elm Dr","Washington Blvd","Park Ave","Lake Rd","River St","Highland Ave","Sunset Blvd","Broadway","1st St","5th Ave"];
const COUNTRIES   = ["US","CA","GB","AU","DE","FR","IN","JP","SG","AE","BR","ZA","MX","NG","IT"];
const ADJECTIVES  = ["Amazing","Bold","Clever","Dynamic","Elegant","Fierce","Grand","Happy","Innovative","Joyful","Keen","Lively","Modern","Noble","Optimal","Polished","Quick","Robust","Smart","Trusty","Unique","Vibrant","Wise","Xtra","Youthful","Zealous"];
const NOUNS       = ["Solution","Platform","Hub","Service","Tool","Engine","System","Network","Suite","Portal","Bridge","Studio","Lab","Works","Cloud"];
const TLD         = ["com","io","co","net","org","app","dev"];
const PRODUCTS    = ["Widget","Gadget","Gizmo","Device","Module","Unit","Component","Part","Item","Product","Tool","Kit","Pack","Set","Bundle"];
const STATUSES    = ["active","inactive","pending","approved","draft","published","archived"];

function fakeName()    { return `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`; }
function fakeEmail()   { const u = `${rand(FIRST_NAMES).toLowerCase()}.${rand(LAST_NAMES).toLowerCase()}${randInt(1,99)}`; return `${u}@${rand(DOMAINS)}`; }
function fakePhone()   { return `+1${randInt(200,999)}${randInt(100,999)}${randInt(1000,9999)}`; }
function fakeUrl()     { return `https://${rand(ADJECTIVES).toLowerCase()}${rand(NOUNS).toLowerCase()}.${rand(TLD)}`; }
function fakeDate()    { const y=randInt(2018,2025), m=String(randInt(1,12)).padStart(2,"0"), d=String(randInt(1,28)).padStart(2,"0"); return `${y}-${m}-${d}`; }
function fakeAddress() { return `${randInt(1,9999)} ${rand(STREETS)}, ${rand(CITIES)}, ${rand(COUNTRIES)} ${randInt(10000,99999)}`; }
function fakeCompany() { return rand(COMPANIES); }
function fakeCity()    { return rand(CITIES); }
function fakeCountry() { return rand(COUNTRIES); }
function fakeProduct() { return `${rand(ADJECTIVES)} ${rand(PRODUCTS)}`; }
function fakeBool()    { return Math.random() > 0.5; }

function guessNumber(name: string): number {
  if (name.includes("age"))    return randInt(18, 75);
  if (name.includes("year"))   return randInt(2000, 2025);
  if (name.includes("count") || name.includes("quantity") || name.includes("qty")) return randInt(1, 500);
  if (name.includes("price") || name.includes("cost") || name.includes("amount")) return parseFloat((Math.random() * 990 + 10).toFixed(2));
  if (name.includes("salary") || name.includes("revenue")) return randInt(30000, 200000);
  if (name.includes("rating") || name.includes("score")) return parseFloat((Math.random() * 5).toFixed(1));
  if (name.includes("percent") || name.includes("rate")) return parseFloat((Math.random() * 100).toFixed(1));
  if (name.includes("id"))     return randInt(1000, 99999);
  return randInt(1, 1000);
}

function generateValue(fieldName: string, fieldType: string): unknown {
  const name = fieldName.toLowerCase();

  // Explicit type overrides
  switch (fieldType) {
    case "boolean": return fakeBool();
    case "number":  return guessNumber(name);
    case "email":   return fakeEmail();
    case "url":     return fakeUrl();
    case "date":    return fakeDate();
    case "phone":   return fakePhone();
    case "address": return fakeAddress();
  }

  // Infer from field name for "string" type
  if (name.includes("email"))                                        return fakeEmail();
  if (name.includes("phone") || name.includes("mobile"))            return fakePhone();
  if (name.includes("url") || name.includes("website") || name.includes("link")) return fakeUrl();
  if (name.includes("address") || name.includes("street"))          return fakeAddress();
  if (name.includes("city"))                                         return fakeCity();
  if (name.includes("country"))                                      return fakeCountry();
  if (name.includes("company") || name.includes("org") || name.includes("employer")) return fakeCompany();
  if (name.includes("product") || name.includes("item"))            return fakeProduct();
  if (name.includes("username") || name.includes("user_name") || name.includes("handle")) {
    return `${rand(FIRST_NAMES).toLowerCase()}_${randInt(10,999)}`;
  }
  if (name.includes("first"))    return rand(FIRST_NAMES);
  if (name.includes("last") || name.includes("surname")) return rand(LAST_NAMES);
  if (name.includes("name"))     return fakeName();
  if (name.includes("age"))      return randInt(18, 75);
  if (name.includes("date") || name.includes("_at") || name.includes("time")) return fakeDate();
  if (name.includes("price") || name.includes("cost") || name.includes("amount") || name.includes("salary")) {
    return parseFloat((Math.random() * 990 + 10).toFixed(2));
  }
  if (name.includes("rating") || name.includes("score")) return parseFloat((Math.random() * 5).toFixed(1));
  if (name.includes("id"))       return crypto.randomUUID();
  if (name.includes("bool") || name.includes("active") || name.includes("enabled") || name.includes("verified")) return fakeBool();
  if (name.includes("description") || name.includes("bio") || name.includes("note") || name.includes("comment")) {
    return `${rand(ADJECTIVES)} ${rand(NOUNS).toLowerCase()} that provides ${rand(ADJECTIVES).toLowerCase()} functionality.`;
  }
  if (name.includes("category") || name.includes("type") || name.includes("status")) return rand(STATUSES);
  if (name.includes("color") || name.includes("colour")) {
    return rand(["red","blue","green","yellow","purple","orange","pink","black","white","gray"]);
  }
  if (name.includes("gender")) return rand(["male","female","non-binary","prefer not to say"]);
  if (name.includes("role"))   return rand(["admin","user","moderator","viewer","editor"]);
  if (name.includes("tag") || name.includes("label")) return rand(["featured","new","sale","limited","popular"]);
  if (name.includes("image") || name.includes("avatar") || name.includes("photo")) {
    return `https://picsum.photos/seed/${randInt(1,1000)}/200/200`;
  }

  // Default
  return `${rand(ADJECTIVES)} ${rand(NOUNS)}`;
}

function generateRecords(
  schemaDef: Record<string, string>,
  count = 10
): Record<string, unknown>[] {
  return Array.from({ length: count }, () => {
    const record: Record<string, unknown> = {};
    for (const [field, type] of Object.entries(schemaDef)) {
      record[field] = generateValue(field, type);
    }
    return record;
  });
}

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, description, schemaDefinition } = await req.json();

    if (!name?.trim() || !schemaDefinition || Object.keys(schemaDefinition).length === 0) {
      return new Response(
        JSON.stringify({ error: "name and schemaDefinition are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiEndpoint = `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const generatedData = generateRecords(schemaDefinition, 10);

    const { data: schema, error: schemaError } = await supabaseClient
      .from("schemas")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        schema_definition: schemaDefinition,
        api_endpoint: apiEndpoint,
      })
      .select()
      .single();

    if (schemaError) throw schemaError;

    const records = generatedData.map((r) => ({ schema_id: schema.id, data: r }));
    const { error: dataError } = await supabaseClient
      .from("generated_data")
      .insert(records);

    if (dataError) throw dataError;

    console.log(`Created schema ${schema.id} with ${generatedData.length} records`);

    return new Response(
      JSON.stringify({ success: true, schema, recordCount: generatedData.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-schema:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
