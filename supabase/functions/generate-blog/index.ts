import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, keywords } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const keywordList = keywords ? `Palavras-chave: ${keywords}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um redator SEO especializado em desenvolvimento pessoal, estoicismo, psicologia e crescimento mental. Escreva posts de blog otimizados para SEO em português brasileiro. Use markdown para formatação. Inclua headings (H2, H3), parágrafos curtos, listas quando apropriado. O conteúdo deve ser original, engajante e informativo.`,
          },
          {
            role: "user",
            content: `Escreva um post de blog completo sobre: "${topic}". ${keywordList}. Retorne APENAS um JSON válido com os campos: title (string), excerpt (resumo de 1-2 frases para meta description, máximo 160 caracteres), content (string em markdown, mínimo 800 palavras), slug (string em kebab-case sem acentos).`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_blog_post",
              description: "Create a SEO-optimized blog post",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "SEO title under 60 chars" },
                  excerpt: { type: "string", description: "Meta description under 160 chars" },
                  content: { type: "string", description: "Full blog content in markdown" },
                  slug: { type: "string", description: "URL slug in kebab-case without accents" },
                },
                required: ["title", "excerpt", "content", "slug"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_blog_post" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const blogData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(blogData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
