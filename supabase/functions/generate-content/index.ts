import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) throw new Error("No AI API key configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { mode, messages, context } = await req.json();

    // For user-facing generation, fetch their profile for personalization
    let userContext = "";
    if (mode === "generate_missions" || mode === "generate_tip" || mode === "generate_course" || mode === "generate_post") {
      const { data: profile } = await supabase.from("profiles").select("display_name, level, points, streak").eq("user_id", user.id).single();
      if (profile) {
        userContext = `\nContexto do usuário: Nome: ${profile.display_name}, Nível: ${profile.level}, Pontos: ${profile.points}, Dias seguidos: ${profile.streak} dias.`;
      }
    }

    const systemPrompts: Record<string, string> = {
      onboarding_chat: `Você é o mentor pessoal da plataforma Cerebralta - uma rede de desenvolvimento mental masculino.
${userContext}
Você está conversando com um novo usuário para entender o que ele quer melhorar na vida.
REGRAS:
- Faça UMA pergunta por vez para entender melhor a situação dele (rotina, hábitos, dificuldades)
- Seja empático mas direto, como um irmão mais velho que se importa
- Use linguagem casual mas inteligente
- Após 2-3 trocas de mensagem, quando sentir que tem informação suficiente, responda com EXATAMENTE este formato JSON:
{"ready": true, "summary": "resumo do que o usuário quer melhorar e sua situação", "missions": [{"title":"...","description":"...","category":"...","points":N,"icon":"emoji"}]}
- Gere 3-5 missões MUITO específicas e práticas baseadas na conversa
- Missões devem ser realizáveis em 1 dia
- Categorias válidas: disciplina, mindset, social, saúde, estratégia
- Pontos entre 10 e 50 proporcionais à dificuldade
- Exemplo: se o cara diz que pega o celular ao acordar, dê missão "Deixe o celular em outro cômodo antes de dormir" ou "Faça 2min de respiração Wim Hof ao acordar"
- NÃO gere missões genéricas. Seja ESPECÍFICO baseado no que ele disse.
- Se ainda não tem info suficiente, responda apenas texto (sem JSON)
Escreva em português brasileiro.`,

      generate_missions: `Você é o criador de missões da plataforma Cerebralta - uma rede de desenvolvimento mental masculino.
${userContext}
Gere EXATAMENTE 3 missões práticas e desafiadoras para este usuário baseado no nível dele.
Retorne APENAS um JSON array no formato:
[{"title":"...","description":"...","category":"...","points":N,"icon":"emoji"}]
Categorias válidas: disciplina, mindset, social, saúde, estratégia.
Pontos entre 10 e 50. Missões devem ser realizáveis em 1 dia.
Cada missão deve exigir ação real, não apenas leitura. Seja criativo e desafiador.
Escreva em português brasileiro.`,

      generate_tip: `Você é um mentor de desenvolvimento pessoal da plataforma Cerebralta.
${userContext}
Gere uma dica personalizada para este usuário baseada no nível e progresso dele.
A dica deve ser prática, profunda e acionável. Entre 2-4 parágrafos.
Escreva em português brasileiro. Sem formatação JSON, apenas texto em markdown.`,

      generate_course: `Você é um criador de conteúdo educacional da plataforma Cerebralta.
${userContext}
${context ? `Tema solicitado: ${context}` : ""}
Gere um artigo/módulo educacional completo.
Retorne EXATAMENTE neste formato JSON:
{"title":"...","description":"resumo de 1 linha","category":"...","content":"conteúdo completo em markdown"}
Categorias válidas: geral, estratégia, estoicismo, psicologia, liderança.
O conteúdo deve ter no mínimo 500 palavras, ser profundo e prático.
Escreva em português brasileiro.`,

      generate_post: `Você é o perfil oficial "Cerebralta" da plataforma.
${userContext}
Gere um post reflexivo/motivacional poderoso para o feed.
O post deve ter entre 100-300 caracteres, ser impactante e provocativo.
Retorne EXATAMENTE neste formato JSON:
{"content":"...","category":"reflexão|estratégia|estoicismo|prática"}
Escreva em português brasileiro. Sem hashtags, sem emojis excessivos.`,

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

    // Non-streaming for structured responses
    if (["generate_missions", "generate_course", "generate_post", "onboarding_chat"].includes(mode)) {
      const aiMessages = [
        { role: "system", content: systemPrompt },
        ...(messages ?? [{ role: "user", content: context || "Gere o conteúdo agora." }]),
      ];

      const apiKey = LOVABLE_API_KEY || GEMINI_API_KEY;
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, stream: false }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? "";

      // Auto-save generated content to DB
      if (mode === "onboarding_chat") {
        // Check if AI returned ready JSON with missions
        try {
          const jsonMatch = content.match(/\{[\s\S]*"ready"\s*:\s*true[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.missions && Array.isArray(parsed.missions)) {
              for (const m of parsed.missions) {
                const { data: inserted } = await supabase.from("missions").insert({
                  title: m.title,
                  description: m.description,
                  category: m.category,
                  points: m.points || 10,
                  icon: m.icon || "📝",
                  is_active: true,
                  is_premium: false,
                }).select("id").single();
                if (inserted) {
                  await supabase.from("user_missions").insert({ user_id: user.id, mission_id: inserted.id });
                }
              }
            }
          }
        } catch (e) { console.error("Failed to save onboarding missions:", e); }
      }

      if (mode === "generate_missions") {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const missions = JSON.parse(jsonMatch[0]);
            for (const m of missions) {
              const { data: inserted } = await supabase.from("missions").insert({
                title: m.title,
                description: m.description,
                category: m.category,
                points: m.points || 10,
                icon: m.icon || "📝",
                is_active: true,
                is_premium: false,
              }).select("id").single();
              if (inserted) {
                await supabase.from("user_missions").insert({ user_id: user.id, mission_id: inserted.id });
              }
            }
          }
        } catch (e) { console.error("Failed to save missions:", e); }
      }

      if (mode === "generate_post") {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const post = JSON.parse(jsonMatch[0]);
            await supabase.from("posts").insert({
              user_id: user.id,
              content: post.content,
              category: post.category || "reflexão",
            });
          }
        } catch (e) { console.error("Failed to save post:", e); }
      }

      if (mode === "generate_course") {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const course = JSON.parse(jsonMatch[0]);
            await supabase.from("courses").insert({
              title: course.title,
              description: course.description || "",
              category: course.category || "geral",
              author_id: user.id,
            });
          }
        } catch (e) { console.error("Failed to save course:", e); }
      }

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming for tips and assistant mode
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages ?? [{ role: "user", content: context || "Gere o conteúdo agora." }]),
    ];

    const apiKey = LOVABLE_API_KEY || GEMINI_API_KEY;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: aiMessages, stream: true }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
