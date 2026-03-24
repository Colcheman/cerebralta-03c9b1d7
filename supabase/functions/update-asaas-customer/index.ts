import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
  if (!ASAAS_API_KEY) {
    return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user from auth header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { phone, email, cpfCnpj } = await req.json();

  // Check Asaas environment
  const { data: envSetting } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "asaas_environment")
    .maybeSingle();

  const asaasEnv = envSetting?.value ?? "sandbox";
  const ASAAS_BASE_URL = asaasEnv === "production"
    ? "https://api.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

  try {
    // Find customer by externalReference (user_id) or email
    const searchRes = await fetch(
      `${ASAAS_BASE_URL}/customers?externalReference=${user.id}`,
      { headers: { access_token: ASAAS_API_KEY } }
    );
    const searchData = await searchRes.json();

    const updateBody: Record<string, string> = {};
    if (phone) updateBody.phone = phone;
    if (email) updateBody.email = email;
    if (cpfCnpj) updateBody.cpfCnpj = cpfCnpj;

    if (searchData.data?.length > 0) {
      // Update existing customer
      const customerId = searchData.data[0].id;
      const updateRes = await fetch(`${ASAAS_BASE_URL}/customers/${customerId}`, {
        method: "PUT",
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        return new Response(JSON.stringify({ error: errData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new customer with the provided data
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          access_token: ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile?.display_name || "Usuário Cerebralta",
          externalReference: user.id,
          ...updateBody,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        return new Response(JSON.stringify({ error: errData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
