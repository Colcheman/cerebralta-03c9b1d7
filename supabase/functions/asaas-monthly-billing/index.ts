import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";

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

  try {
    // Get previous month
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Get all premium profiles with CPF
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, cpf, display_name")
      .eq("subscription_tier", "premium");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No premium users found", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const profile of profiles) {
      try {
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

        // Find customer in Asaas by CPF
        const cpfDigits = profile.cpf.replace(/\D/g, "");
        const customerRes = await fetch(
          `${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfDigits}`,
          { headers: { access_token: ASAAS_API_KEY } }
        );
        const customerData = await customerRes.json();

        if (!customerRes.ok) {
          results.push({ user_id: profile.user_id, error: `Asaas customer lookup failed: ${JSON.stringify(customerData)}` });
          continue;
        }

        const customer = customerData.data?.[0];
        if (!customer) {
          results.push({ user_id: profile.user_id, error: "Customer not found in Asaas" });
          continue;
        }

        // Create charge for this month
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 10)
          .toISOString()
          .split("T")[0]; // Due on 10th of current month

        const chargeRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
          method: "POST",
          headers: {
            access_token: ASAAS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customer.id,
            billingType: "BOLETO",
            value: billingAmount,
            dueDate,
            description: `CerebrAlta - ${prevMonth}/${prevYear} | ${days} dias ativos | ${discount}% desconto`,
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

        results.push({
          user_id: profile.user_id,
          cpf: cpfDigits,
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
