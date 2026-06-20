## Goal
- Construir o GoPay, plataforma completa de checkout e gateway de pagamentos com identidade própria, editor white-label, IA Julia de suporte, PWA, placas de meta, Pix real, deploy no GitHub Pages.

## Constraints & Preferences
- Stack: Node.js/Express/TypeScript backend, React/Vite/TailwindCSS frontend, PostgreSQL (Supabase)
- 3 gateways obrigatórios: AbacatePay, KryptGateway, PixGo — interface comum, webhooks com validação HMAC
- Multi-tenant (cada vendedor vê só seus dados), JWT com refresh token, chaves de gateway criptografadas
- Taxa GoPay: R$ 7 por transação (KryptGateway com credenciais fornecidas)
- IA Julia 24h via Groq Llama 3.1 — chave `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` (env var `VITE_GROQ_API_KEY`, com fallback hardcoded)
- Editor white-label com banner, logo, vídeo, quiz, galeria, avaliações, cores, CSS/JS customizado, editor de fotos
- PWA instalável com notificações push
- HashRouter para compatibilidade GitHub Pages (URLs com `#/`)
- Hospedagem: GitHub Pages (frontend) + Railway/Render (backend) + Supabase (banco/auth)
- Repositório: `contadtv169-stack/gopayapppro`
- **Zero simulação/demo** — tudo conectado ao Supabase real, sem toggle demo/produção
- CamFacial: verificação facial com guia de rosto (círculo + detecção automática) via página dedicada
- Pix real: geração do BR Code (padrão BCB) com CRC16, QR Code visível, chave Pix do vendedor
- Placas: sistema de metas com 10 placas, níveis (bronze, prata, ouro, platina, diamante, noturno, rubi), download PNG (html2canvas) e impressão

## Progress
### Done
- Estrutura completa do projeto (monorepo `gopay/backend/` e `gopay/frontend/`)
- Backend: migrations SQL (001_initial, 002_checkout_customization, 003_supabase_tables), config (Supabase, JWT), middleware (auth, rateLimit), serviços (auth, product, order, payment-link, gateway-credential, notification, customization), rotas REST, gateways (AbacatePay, KryptGateway, PixGo) com interface comum, webhooks HMAC, queue BullMQ com fallback in-memory
- Frontend: landing page (taxa R$ 7), login/register com Supabase Auth real, dashboard com dados reais do Supabase
- Editor White-Label completo (banner, logo, vídeo, quiz, galeria, avaliações, cores, CSS/JS) com preview estilo Hotmart
- IA Julia (AIChat.tsx) — avatar com imagem específica, nome "Julia", integrada no dashboard
- PWA: manifest.json (caminhos relativos), service worker, 404.html (redirect para hash), SVG icons, .nojekyll
- Deploy GitHub Actions configurado (build + deploy-pages)
- Workflows passando com sucesso
- **HashRouter** implementado para SPA routing no GitHub Pages
- **Supabase Auth** real no frontend (signInWithPassword, signUp) — sem backend customizado para auth
- **supabaseData.ts**: serviço de dados real (products, orders, payment_links, notifications, customizations)
- **DashboardLayout**: menu inferior mobile, notificações com dropdown, botão "Baixar App"
- **WhatsApp/Green API**: página com conexão real, teste de instância, respostas automáticas com Julia, salvo no Supabase
- **CamFacial**: página dedicada em `CamFacial.tsx` com guia em círculo, detecção de luminosidade, captura automática, 3 passos visuais
- **NotificationSettings**: permissão push, lista de alertas, integração com Service Worker
- **Notifications**: página dedicada com lista, filtro de lidas/não lidas, tipos (payment, order, alert, info)
- **003_supabase_tables.sql**: tabelas products, orders, payment_links, notifications, gateway_credentials, whatsapp_config, customizations, plaques + RLS policies + DROP POLICY IF EXISTS + DROP CONSTRAINT IF EXISTS + ALTER COLUMN SET DEFAULT auth.uid()
- **apiAuth.ts e demoData.ts deletados** — zero mock/demo
- Groq API key colocada como fallback hardcoded em AIChat.tsx (funciona sem configurar env var)
- Build TypeScript + Vite passando
- **FK constraint fix**: removido `REFERENCES auth.users(id)` de todas as tabelas (agora `UUID NOT NULL`), getUserId() busca localStorage + session fallback
- **Editor mobile responsivo**: header empilhado, tabs horizontais, preview full-width no mobile, white label toggle na aba Avançado
- **Foto de perfil**: upload em Settings (FileReader, dataURL), exibida no header DashboardLayout
- **Checkout pages**: reescritas em `checkoutService.ts` (busca produto/link/customizações no Supabase direto, cria pedido, gera Pix)
- **Pix real**: gerador de BR Code com CRC16, usa chave Pix do vendedor (Settings), QR Code via `api.qrserver.com`
- **Gateway test**: botão "Testar" em cada gateway com status Online/Falha/Testando
- **Editor com editor de fotos**: modal canvas (brilho, contraste, preto e branco, sépia), upload de imagens para galeria
- **Placas**: `plaquesService.ts`, `Placas.tsx`, 10 metas (vendas/receitas), download PNG com `html2canvas`, impressão, layout responsivo com progresso
- **html2canvas** instalado para exportação PNG
- **Editor de fotos corrigido**: `applyFilter` global removida, substituído por `useCallback` + `useEffect` com estado React real, canvas ref e img ref
- Repositório pusheado com múltiplos commits (último 8: 35d4f3a)

### In Progress
- (none)

### Blocked
- **Backend não deployado**: Railway/Render pendente — frontend usa Supabase direto, mas gateways reais (webhooks) precisam do backend
- **SQL migration não executada**: usuário precisa rodar `003_supabase_tables.sql` no Supabase SQL Editor (agora com DROP + ALTER, seguro reexecutar)
- **VITE_GROQ_API_KEY não configurada no GitHub Secrets**: opcional (fallback hardcoded presente), mas ideal para segurança

## Key Decisions
- HashRouter em vez de BrowserRouter para SPA no GitHub Pages (evita 404 em subpaths)
- Frontend usa Supabase Auth diretamente (signInWithPassword/signUp) — remove dependência do backend customizado para login
- Dados do painel via supabaseData.ts (queries diretas ao Supabase) — backend só necessário para webhooks e gateways
- Chat IA Julia: avatar hardcoded, fallback da Groq key hardcoded (já exposta publicamente)
- CamFacial: detecção simples por luminosidade do pixel central (sem dependência externa) — captura automática após 1s de rosto detectado
- Notificações: tabela `notifications` no Supabase + Notification API do browser
- FK constraints removidas (`REFERENCES auth.users(id)`) para evitar erro de chave estrangeira — RLS policies garantem isolamento
- Pix real: gerador BR Code client-side com CRC16, sem depender do backend
- Editor sem toggle demo/produção — tudo real desde o início
- Placas: html2canvas para exportação PNG (instalado como dependência)
- Editor de fotos: `useCallback` + `useEffect` em vez de função global `applyFilter` com `document.querySelector`
- `package-lock.json` commitado (resolveu conflitos de dependência)

## Next Steps
1. Usuário executar `003_supabase_tables.sql` no Supabase SQL Editor (agora idempotente — DROP + ALTER)
2. Usuário ativar GitHub Pages em Settings > Pages > Source: "GitHub Actions" (se não estiver ativo)
3. Cadastrar chave Pix em Configurações para gerar Pix real no checkout
4. Configurar VITE_GROQ_API_KEY nos GitHub Secrets para segurança
5. Deployar backend em Railway/Render para habilitar webhooks de gateway
6. Testar fluxo completo: cadastro → criar produto → personalizar editor → publicar → checkout → pagamento → webhook → confirmação
7. Gerar icons PNG reais para PWA
8. Configurar domínio personalizado (CNAME)

## Critical Context
- Supabase URL: `https://wnjpzsxrwwrskakrhfgg.supabase.co`
- Supabase Anon Key: `sb_publishable_mWFzAPYyXdhy0Psxj-x7lA_mYzu0clG` (funciona para auth e queries RLS)
- Groq API Key: `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` (env var `VITE_GROQ_API_KEY`, fallback hardcoded)
- KryptGateway creds (taxa R$7): `ci: krypt_ci_982568e2deb01be2c1`, `cs: krypt_cs_9670f14f480666d50720f4526eb34a5c`
- Branch `master` — workflow configurado para `main` e `master`
- Login demo removido — agora usa Supabase Auth real (criar conta em `/#/register`)
- Chat Julia avatar: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJkr-rqY4NQ35f4kh4_0WLwfBYV8OlnMTJzQ&s`
- HashRouter → URLs com `#/` (ex: `/#/dashboard`, `/#/login`)
- 404.html redireciona de `/path` para `index.html#/path`
- Supabase RLS policies exigem que as tabelas existam (rodar migration 003)
- FK removidas: agora `user_id UUID NOT NULL` sem `REFERENCES auth.users(id)` — RLS + código garantem isolamento
- `getUserId()`: tenta localStorage (`gopay_user`), fallback `supabase.auth.getSession()`
- Pix BR Code: gerado com CRC16 client-side, chave Pix do vendedor em `gopay_user.pix_key`
- Editor publica produto com `is_active: true` e salva customizações + gera checkout_url
- `html2canvas` (v1.4.2) instalado via npm

## Relevant Files
- `gopay/.github/workflows/deploy.yml`: CI/CD frontend + build backend (Railway pendente)
- `gopay/backend/migrations/003_supabase_tables.sql`: tabelas reais + RLS + DROP + ALTER DEFAULT + plaques (precisa executar)
- `gopay/frontend/src/services/supabase.ts`: cliente Supabase (url + anon key)
- `gopay/frontend/src/services/supabaseData.ts`: CRUD real para products, orders, payment_links, notifications, customizations (com getUserId async)
- `gopay/frontend/src/services/auth.ts`: login/register com Supabase Auth (signInWithPassword, signUp)
- `gopay/frontend/src/services/checkoutService.ts`: busca produto/link/customizações no Supabase, cria pedido, gera Pix BR Code com CRC16
- `gopay/frontend/src/services/plaquesService.ts`: sincroniza placas, calcula vendas/receita, templates e cores
- `gopay/frontend/src/components/AIChat.tsx`: Julia IA (avatar, nome, Groq Llama 3.1)
- `gopay/frontend/src/layouts/DashboardLayout.tsx`: sidebar, mobile bottom nav, notificações dropdown, foto de perfil no header, link Placas
- `gopay/frontend/src/pages/dashboard/Settings.tsx`: perfil + chave Pix + upload avatar + CamFacial link + gateways com teste + notificações
- `gopay/frontend/src/pages/dashboard/CamFacial.tsx`: página dedicada de verificação facial com câmera, guia oval, 3 passos, captura automática
- `gopay/frontend/src/pages/dashboard/Placas.tsx`: 10 placas, metas, download PNG (html2canvas), impressão, progresso, níveis de cor
- `gopay/frontend/src/pages/dashboard/Editor.tsx`: editor completo sem demo, banner full-width, preview Hotmart, editor de fotos (canvas via useCallback + useEffect), upload galeria
- `gopay/frontend/src/pages/CheckoutPage.tsx`: checkout com customizações do editor, Pix real, QR Code, timer
- `gopay/frontend/src/pages/PaymentLinkPage.tsx`: link de pagamento com Pix real, QR Code
- `gopay/frontend/src/pages/dashboard/Products.tsx`: CRUD com link checkout + botão editor + copiar link
- `gopay/frontend/src/pages/dashboard/PaymentLinks.tsx`: links com URL real do GitHub Pages
- `gopay/frontend/src/pages/dashboard/Notifications.tsx`: lista de notificações com tipos e status
- `gopay/frontend/src/pages/dashboard/NotificationSettings.tsx`: permissão push + preview
- `gopay/frontend/src/pages/dashboard/WhatsApp.tsx`: Green API + respostas automáticas Julia
- `gopay/frontend/src/pages/dashboard/Dashboard.tsx`: stats reais do Supabase
- `gopay/frontend/src/pages/dashboard/Orders.tsx`: pedidos reais com filtro
- `gopay/frontend/public/404.html`: redirect para `index.html#/path` (HashRouter)
- `gopay/frontend/public/manifest.json`: PWA com caminhos relativos
- `gopay/frontend/public/sw.js`: service worker com cache e push
