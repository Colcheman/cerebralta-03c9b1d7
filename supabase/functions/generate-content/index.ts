import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Try GEMINI_API_KEY first (portable), fallback to LOVABLE_API_KEY (Lovable Cloud)
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const { messages, mode } = await req.json();

    const systemPrompts: Record<string, string> = {
      generate: `Você é um criador de conteúdo educacional para a plataforma Cerebralta. 
Quando o usuário pedir para gerar um módulo de curso, retorne EXATAMENTE no formato JSON:
{"title": "...", "description": "...", "category": "...", "content": "..."}
Categorias válidas: geral, estratégia, estoicismo, psicologia, liderança.
O campo "content" deve ser o conteúdo completo do módulo em markdown, detalhado e educativo.
Escreva em português brasileiro. Seja profundo, prático e inspirador.`,
      
      assistant: `Você é um assistente de escrita para a plataforma educacional Cerebralta.
Ajude o administrador a refinar, melhorar e criar conteúdo educacional.
Responda em português brasileiro. Seja útil, conciso e criativo.
Pode sugerir melhorias de texto, gerar ideias, reformular conteúdo, etc.`,
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.assistant;

    // Route to Gemini API directly if key available, otherwise use Lovable gateway
    if (GEMINI_API_KEY) {
      return await callGeminiDirect(GEMINI_API_KEY, systemPrompt, messages);
    } else if (LOVABLE_API_KEY) {
      return await callLovableGateway(LOVABLE_API_KEY, systemPrompt, messages);
    } else {
      throw new Error("Nenhuma API key configurada (GEMINI_API_KEY ou LOVABLE_API_KEY)");
    }
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Google Gemini API directly (portable - works on Cloudflare, Vercel, etc.)
async function callGeminiDirect(apiKey: string, systemPrompt: string, messages: any[]) {
  const geminiMessages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Entendido. Estou pronto para ajudar." }] },
    ...messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", response.status, errText);
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit do Gemini. Tente novamente em alguns segundos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Erro na API do Gemini" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Transform Gemini SSE to OpenAI-compatible SSE format for the frontend
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");
      
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            // Emit in OpenAI-compatible format
            const openAIChunk = {
              choices: [{ delta: { content } }],
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
          }
        } catch { /* partial json */ }
      }
    },
    flush(controller) {
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
    },
  });

  const stream = response.body!.pipeThrough(transformStream);
  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// Lovable AI Gateway (works only inside Lovable Cloud)
async function callLovableGateway(apiKey: string, systemPrompt: string, messages: any[]) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}
