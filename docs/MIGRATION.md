# 🚀 Guia de Migração - Cerebralta

## Arquitetura

```
Frontend (React/Vite) → Cloudflare Pages
IA (Gemini API)       → Cloudflare Worker
Banco de Dados        → Supabase (externo, gratuito)
WhatsApp              → Servidor Baileys/Evolution API (VPS)
```

---

## 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Anote: **Project URL**, **anon key** e **service_role key**
3. Vá em **SQL Editor** e execute o arquivo `docs/schema.sql` completo
4. Em **Authentication → Settings**:
   - Desabilite confirmação de email (se quiser login instantâneo)
   - Ou mantenha habilitado para segurança

---

## 2. Configurar Variáveis

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

---

## 3. Deploy Frontend (Cloudflare Pages)

```bash
# Build local
npm run build

# Opção A: Cloudflare Pages via Git
# Conecte seu repo GitHub no dashboard do Cloudflare Pages
# Build command: npm run build
# Output directory: dist

# Opção B: Deploy direto
npx wrangler pages deploy dist --project-name cerebralta
```

No Cloudflare Pages → Settings → Environment Variables, adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

---

## 4. Deploy Worker de IA (Cloudflare Workers)

```bash
# Na pasta docs/
cd docs

# Crie wrangler.toml
cat > wrangler.toml << 'EOF'
name = "cerebralta-ai"
main = "cloudflare-worker-ai.js"
compatibility_date = "2024-01-01"
EOF

# Adicione a secret
npx wrangler secret put GEMINI_API_KEY
# Cole sua chave do Google AI Studio

# Deploy
npx wrangler deploy
```

Anote a URL do worker (ex: `https://cerebralta-ai.seu-user.workers.dev`)

---

## 5. Atualizar URL da IA no Frontend

No arquivo `src/components/admin/AdminAIAssistant.tsx`, troque:

```typescript
// DE:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`;

// PARA:
const CHAT_URL = import.meta.env.VITE_AI_WORKER_URL || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`;
```

E adicione `VITE_AI_WORKER_URL` nas variáveis de ambiente do Cloudflare Pages.

---

## 6. WhatsApp (Opcional)

### Opção A: Evolution API (mais fácil)

```bash
# Docker
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave \
  atendai/evolution-api
```

### Opção B: Baileys (mais controle)

Crie um servidor Node.js que:
1. Mantém sessão WhatsApp via QR code
2. Expõe endpoint POST `/api/send-message`
3. Consome a tabela `notification_queue` do Supabase

### Integração

Configure `WHATSAPP_WEBHOOK_URL` no admin da plataforma apontando para seu servidor.

---

## 7. Criar Primeiro Admin

Após criar sua conta na plataforma, execute no SQL Editor do Supabase:

```sql
-- Encontre seu user_id
SELECT id, raw_user_meta_data->>'display_name' as name 
FROM auth.users;

-- Adicione role admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('SEU-USER-ID-AQUI', 'admin');
```

---

## 8. Checklist Final

- [ ] Supabase criado e schema executado
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend deployado no Cloudflare Pages
- [ ] Worker de IA deployado (opcional)
- [ ] Primeiro admin criado
- [ ] Login testado
- [ ] Feed e posts funcionando
- [ ] Chat DM funcionando
- [ ] Painel admin acessível
- [ ] IA respondendo (se configurada)

---

## Custos Estimados

| Serviço | Tier Gratuito |
|---------|---------------|
| Supabase | 500MB DB, 1GB storage, 50k auth users |
| Cloudflare Pages | Ilimitado sites, 500 builds/mês |
| Cloudflare Workers | 100k req/dia |
| Gemini API | 15 req/min, 1M tokens/dia |
| VPS (WhatsApp) | ~$5/mês (opcional) |

**Total: $0-5/mês** para começar 🎉
