# GoPay - Setup GitHub
# Execute este script para configurar o repositório no GitHub

$REPO_NAME = "gopayapppro"
$GITHUB_USER = "gopayapppro"

Write-Host "=== GoPay - Configuração GitHub ===" -ForegroundColor Green
Write-Host ""
Write-Host "Passo 1: Criar repositório no GitHub"
Write-Host "  gh repo create $REPO_NAME --public --description 'GoPay - Plataforma de Checkout e Gateway de Pagamentos'"
Write-Host ""

Write-Host "Passo 2: Inicializar git e fazer push" -ForegroundColor Yellow
Write-Host @"
git init
git add .
git commit -m "Initial commit: GoPay payment platform"
git branch -M main
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git
git push -u origin main
"@
Write-Host ""

Write-Host "Passo 3: Configurar GitHub Secrets" -ForegroundColor Yellow
Write-Host @"
gh secret set SUPABASE_URL -b"sua_url"
gh secret set SUPABASE_SERVICE_KEY -b"sua_key"
gh secret set JWT_SECRET -b"seu_jwt_secret"
gh secret set GROQ_API_KEY -b"coloque_sua_chave_groq_aqui"
gh secret set KRYPT_CLIENT_ID -b"coloque_seu_client_id"
gh secret set KRYPT_CLIENT_SECRET -b"coloque_seu_client_secret"
"@
Write-Host ""

Write-Host "Passo 4: Deploy" -ForegroundColor Green
Write-Host @"
Backend: Railway ou Render
  - Connectar repositório
  - Root: backend/
  - Start: npm start
  - Port: 3001

Frontend: Vercel
  - Importar repositório
  - Root: frontend/
  - Build: npm run build
  - Output: dist/
"@
Write-Host ""

Write-Host "Passo 5: Configurar Domínio" -ForegroundColor Cyan
Write-Host "  Domínio sugerido: gopay.com.br ou usar subdomínio da Vercel"
Write-Host "  DNS: Apontar registro A/CNAME para Vercel/Railway"
Write-Host ""

Write-Host "=== Setup completo! ===" -ForegroundColor Green
