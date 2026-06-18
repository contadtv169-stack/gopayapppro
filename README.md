# GoPay - Plataforma de Checkout e Gateway de Pagamentos

GoPay é uma plataforma completa onde vendedores criam produtos, geram links de pagamento ou páginas de checkout, e recebem pagamentos via Pix através de gateways terceirizados (AbacatePay, KryptGateway, PixGo).

## 🚀 Tecnologias

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + Vite + TailwindCSS
- **Banco:** PostgreSQL (Supabase)
- **Autenticação:** JWT + Refresh Token
- **Filas:** Redis + BullMQ (com fallback in-memory)
- **PWA:** Service Worker + Web Push API

## 📁 Estrutura

```
gopay/
├── backend/           # API REST
│   ├── src/
│   │   ├── config/       # Configurações (Supabase, JWT, etc)
│   │   ├── gateways/     # Adaptadores de gateway
│   │   │   ├── interfaces/  # Interface comum
│   │   │   ├── abacatepay/  # AbacatePay adapter
│   │   │   ├── kryptgateway/ # KryptGateway adapter
│   │   │   └── pixgo/       # PixGo adapter
│   │   ├── middleware/   # Auth, rate limiting
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   ├── webhooks/     # Webhooks dos gateways
│   │   └── index.ts      # Entry point
│   └── migrations/      # SQL migrations
├── frontend/          # SPA React
│   ├── src/
│   │   ├── pages/        # Landing, Checkout, Login, Register
│   │   │   └── dashboard/ # Dashboard, Produtos, Pedidos, Editor
│   │   ├── layouts/      # DashboardLayout
│   │   ├── services/     # API client
│   │   └── App.tsx       # Router
│   └── public/         # PWA, favicon, icons
└── README.md
```

## ⚙️ Configuração

### 1. Clone e instale dependências

```bash
git clone https://github.com/gopayapppro/gopay.git
cd gopay

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o banco de dados (Supabase)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. No SQL Editor, execute os arquivos em `/backend/migrations/`:
   - `001_initial.sql` (tabelas principais)
   - `002_checkout_customization.sql` (personalização white-label)
4. Copie as credenciais do Supabase (URL, Anon Key, Service Key) para o `.env`

### 3. Configure as variáveis de ambiente

**Backend (.env):**
```env
# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_key

# JWT
JWT_SECRET=seu_jwt_secret
JWT_REFRESH_SECRET=seu_refresh_secret

# App
PORT=3001
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:3001
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Configure os Gateways de Pagamento

#### AbacatePay
1. Crie conta em [api.abacatepay.com](https://api.abacatepay.com)
2. Gere uma API Key
3. Adicione no painel GoPay em Configurações > Integrações > AbacatePay

#### KryptGateway
1. Acesse [kryptgateway.netlify.app](https://kryptgateway.netlify.app)
2. Obtenha Client ID e Client Secret
3. Adicione no painel GoPay em Configurações > Integrações > KryptGateway

#### PixGo
1. Crie conta em [pixgo.org](https://pixgo.org)
2. Valide sua carteira Liquid
3. Gere API Key e Webhook Secret
4. Adicione no painel GoPay em Configurações > Integrações > PixGo

### 5. Execute o projeto

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar vendedor |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/users/me` | Dados do perfil |
| GET | `/api/products` | Listar produtos |
| POST | `/api/products` | Criar produto |
| GET | `/api/orders` | Listar pedidos |
| GET | `/api/orders/stats` | Estatísticas |
| GET | `/api/payment-links` | Listar links |
| POST | `/api/payment-links` | Criar link |
| GET | `/api/checkout/product/:slug` | Dados do checkout |
| POST | `/api/checkout/product/:slug` | Criar pedido + cobrança |
| GET | `/api/checkout/order/:id/status` | Status do pedido |
| GET | `/api/gateways` | Configurações dos gateways |
| POST | `/api/gateways/:gateway` | Salvar chave do gateway |
| GET | `/api/customizations/checkout/:productId` | Personalização do checkout |
| PUT | `/api/customizations/checkout/:productId` | Salvar personalização |
| POST | `/webhooks/abacatepay` | Webhook AbacatePay |
| POST | `/webhooks/kryptgateway` | Webhook KryptGateway |
| POST | `/webhooks/pixgo` | Webhook PixGo |

## 🎨 Editor White-Label

O GoPay possui um editor visual completo para personalizar a página de checkout:

- **Banner:** Imagem, cor sólida ou gradiente
- **Logo:** Upload com posição ajustável
- **Vídeo:** Incorporação de YouTube/Vimeo
- **Quiz:** Perguntas personalizadas antes da compra
- **Galeria:** Imagens em grade, carrossel ou lista
- **Avaliações:** Depoimentos de clientes com estrelas
- **Cores:** Personalização completa de tema
- **White Label:** Remova a marca GoPay (versão whitelabel)
- **CSS/JS:** Código personalizado

## 🚢 Deploy

### Frontend (GitHub Pages)

O frontend é automaticamente deployado no **GitHub Pages** via GitHub Actions.

```bash
# Ative o GitHub Pages no repositório:
# Settings > Pages > Source: GitHub Actions

# O deploy automático acontece ao fazer push no branch main
# URL: https://seu-usuario.github.io/gopayapppro/
```

**Links de Checkout Personalizados:**
```
https://seu-dominio.com/checkout/product/meu-produto
https://seu-dominio.com/checkout/link/meu-link
```

Para usar domínio personalizado (ex: checkout.gopay.com.br):
1. Compre um domínio
2. No repositório: Settings > Pages > Custom domain
3. Aponte o DNS: CNAME para `seu-usuario.github.io`

### Backend (Railway/Render/Fly.io)

```bash
cd backend
npm run build
# Configure a plataforma para executar: npm start
```

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
# Faça upload da pasta dist/ ou conecte o repositório
```

### GitHub Actions

O arquivo `.github/workflows/deploy.yml` está configurado para CI/CD automático no branch `main`.

## 📱 PWA

O GoPay é um Progressive Web App instalável:
- Android: "Adicionar à tela inicial"
- iOS: Compartilhar > "Adicionar à Tela de Início"
- Notificações push via Web Push API

## 💰 Taxas

- **Taxa GoPay:** R$ 7,00 por transação confirmada
- **Taxa dos gateways:** Variável conforme o provedor
- **Sem taxa de adesão ou mensalidade**

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- JWT com refresh token
- Chaves de API criptografadas no banco
- Validação de webhooks com HMAC-SHA256
- Rate limiting em rotas públicas
- Headers de segurança (Helmet)
- CORS configurado
- Logs de auditoria

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**GoPay** - Receba pagamentos via Pix e cartão em minutos.
