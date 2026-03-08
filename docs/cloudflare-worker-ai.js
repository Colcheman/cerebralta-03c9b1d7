// ======================================================
// CEREBRALTA - Cloudflare Worker para IA (Gemini)
// ======================================================
// Deploy: wrangler deploy
// Secrets: wrangler secret put GEMINI_API_KEY
// ======================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const { messages, mode } = await request.json();
      const GEMINI_API_KEY = env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemPrompts = {
        generate: `Você é um criador de conteúdo educacional para a plataforma Cerebralta. 
Quando o usuário pedir para gerar um módulo de curso, retorne EXATAMENTE no formato JSON:
{"title": "...", "description": "...", "category": "...", "content": "..."}
Categorias válidas: geral, estratégia, estoicismo, psicologia, liderança.
O campo "content" deve ser o conteúdo completo do módulo em markdown, detalhado e educativo.
Escreva em português brasileiro. Seja profundo, prático e inspirador.`,
        assistant: `Você é um assistente de escrita para a plataforma educacional Cerebralta.
Ajude o administrador a refinar, melhorar e criar conteúdo educacional.
Responda em português brasileiro. Seja útil, conciso e criativo.`,
      };

      const systemPrompt = systemPrompts[mode] || systemPrompts.assistant;

      const geminiMessages = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido. Estou pronto para ajudar." }] },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini error:", response.status, errText);
        return new Response(JSON.stringify({ error: "Erro na API do Gemini" }), {
          status: response.status === 429 ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Transform Gemini SSE → OpenAI-compatible SSE
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      (async () => {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                  const chunk = { choices: [{ delta: { content } }] };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch { /* partial */ }
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
