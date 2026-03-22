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

  // Read environment from admin_settings or default to sandbox
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check Asaas environment setting
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
    // Get previous month
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Get all premium profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .eq("subscription_tier", "premium");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No premium users found", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get emails from auth.users via admin API
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const emailMap = new Map<string, string>();
    authUsers?.forEach(u => { if (u.email) emailMap.set(u.id, u.email); });

    const results = [];

    for (const profile of profiles) {
      try {
        const userEmail = emailMap.get(profile.user_id);
        if (!userEmail) {
          results.push({ user_id: profile.user_id, error: "Email not found" });
          continue;
        }

        // Get active days for previous month
        const { data: activeDays } = await supabase.rpc("get_monthly_active_days", {
          _user_id: profile.user_id,
          _year: prevYear,
          _month: prevMonth,
        });

        const days = activeDays ?? 0;

        // Calculate billing amount
        const { data: amount } = await supabase.rpc("calculate_billing_amount", {
          _active_days: days,
        });
        const billingAmount = amount ?? 52.9;

        // Calculate discount
        const { data: discountPct } = await supabase.rpc("calculate_discount", {
          _active_days: days,
        });
        const discount = discountPct ?? 0;

        // Find or create customer in Asaas by email
        let customerId: string | null = null;

        const customerSearchRes = await fetch(
          `${ASAAS_BASE_URL}/customers?email=${encodeURIComponent(userEmail)}`,
          { headers: { access_token: ASAAS_API_KEY } }
        );
        const customerSearchData = await customerSearchRes.json();

        if (customerSearchRes.ok && customerSearchData.data?.length > 0) {
          customerId = customerSearchData.data[0].id;
        } else {
          // Create customer
          const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
            method: "POST",
            headers: {
              access_token: ASAAS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: profile.display_name || "Usuário Cerebralta",
              email: userEmail,
              externalReference: profile.user_id,
            }),
          });
          const createData = await createRes.json();
          if (createRes.ok) {
            customerId = createData.id;
          } else {
            results.push({ user_id: profile.user_id, error: `Failed to create Asaas customer: ${JSON.stringify(createData)}` });
            continue;
          }
        }

        // Create charge
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 10)
          .toISOString()
          .split("T")[0];

        const chargeRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
          method: "POST",
          headers: {
            access_token: ASAAS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerId,
            billingType: "BOLETO",
            value: billingAmount,
            dueDate,
            description: `Cerebralta - ${prevMonth}/${prevYear} | ${days} dias ativos | ${discount}% desconto`,
            externalReference: `${profile.user_id}_${prevYear}_${prevMonth}`,
          }),
        });

        const chargeData = await chargeRes.json();

        if (!chargeRes.ok) {
          results.push({
            user_id: profile.user_id,
            error: `Asaas charge failed [${chargeRes.status}]: ${JSON.stringify(chargeData)}`,
          });
          continue;
        }

        // Save to billing_history
        await supabase.from("billing_history").upsert({
          user_id: profile.user_id,
          month: prevMonth,
          year: prevYear,
          active_days: days,
          discount_percent: discount,
          base_amount: 52.90,
          final_amount: billingAmount,
          asaas_payment_id: chargeData.id,
          status: "pending",
        }, { onConflict: "user_id,month,year" });

        results.push({
          user_id: profile.user_id,
          email: userEmail,
          active_days: days,
          discount: `${discount}%`,
          amount: billingAmount,
          asaas_payment_id: chargeData.id,
          status: "success",
        });
      } catch (err) {
        results.push({
          user_id: profile.user_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        month: `${prevMonth}/${prevYear}`,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Billing error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
