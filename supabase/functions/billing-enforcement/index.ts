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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const results: any[] = [];

  try {
    // Get all pending bills for current month
    const { data: pendingBills } = await supabase
      .from("billing_history")
      .select("*")
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .in("status", ["pending", "fined"]);

    if (!pendingBills || pendingBills.length === 0) {
      return new Response(JSON.stringify({ message: "No pending bills", day: currentDay }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const bill of pendingBills) {
      // Day 15: Apply fine if not already fined
      if (currentDay >= 15 && currentDay < 20 && bill.status === "pending") {
        // Fine = discount amount in reais (the money they saved from recurrence discount)
        const discountInReais = Number(bill.base_amount) - Number(bill.final_amount);
        const fineAmount = discountInReais > 0 ? discountInReais : 0;

        await supabase
          .from("billing_history")
          .update({
            fine_amount: fineAmount,
            status: "fined",
          })
          .eq("id", bill.id);

        // Notify user about fine
        await supabase.from("notifications").insert({
          user_id: bill.user_id,
          type: "system",
          title: "Multa aplicada na fatura",
          message: `Uma multa de R$ ${fineAmount.toFixed(2).replace(".", ",")} foi aplicada à sua fatura de ${currentMonth}/${currentYear} por atraso no pagamento.`,
          sender_label: "Sistema de Cobrança",
        });

        results.push({
          user_id: bill.user_id,
          action: "fine_applied",
          fine_amount: fineAmount,
        });
      }

      // Day 20: Remove premium if still unpaid
      if (currentDay >= 20 && (bill.status === "pending" || bill.status === "fined")) {
        await supabase
          .from("billing_history")
          .update({ status: "overdue" })
          .eq("id", bill.id);

        await supabase
          .from("profiles")
          .update({ subscription_tier: "free" })
          .eq("user_id", bill.user_id);

        results.push({
          user_id: bill.user_id,
          action: "premium_removed",
        });
      }
    }

    return new Response(
      JSON.stringify({ day: currentDay, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Billing enforcement error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
