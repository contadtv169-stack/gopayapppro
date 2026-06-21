import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Smartphone, Link as LinkIcon, BarChart3, CreditCard, Check, ArrowRight, Menu, X, DollarSign } from 'lucide-react';
import { AIChat } from '../components/AIChat';
import { PWAInstall } from '../components/PWAInstall';

const benefits = [
  { icon: Zap, title: 'Pagamento Instantâneo', desc: 'Receba via Pix em segundos, 24h por dia.' },
  { icon: Shield, title: 'Segurança Total', desc: 'Criptografia ponta a ponta e conformidade LGPD.' },
  { icon: Smartphone, title: 'Link de Pagamento', desc: 'Compartilhe links no WhatsApp e redes sociais.' },
  { icon: LinkIcon, title: 'Página de Checkout', desc: 'Página profissional mobile-first para cada produto.' },
  { icon: BarChart3, title: 'Dashboard Completo', desc: 'Acompanhe vendas e métricas em tempo real.' },
  { icon: CreditCard, title: 'Múltiplos Gateways', desc: 'Conecte AbacatePay, KryptGateway, PixGo e mais.' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-go-500 to-primary-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GoPay</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#beneficios" className="text-gray-600 hover:text-gray-900">Benefícios</a>
              <a href="#taxa" className="text-gray-600 hover:text-gray-900">Taxas</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Entrar</Link>
              <Link to="/register" className="btn-primary text-sm !py-2 !px-5">Criar Conta Grátis</Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 flex flex-col gap-3">
            <a href="#beneficios" className="text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Benefícios</a>
            <a href="#taxa" className="text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Taxas</a>
            <Link to="/login" className="text-gray-600 py-2" onClick={() => setMenuOpen(false)}>Entrar</Link>
            <Link to="/register" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>Criar Conta Grátis</Link>
          </div>
        )}
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://i.ibb.co/KzQNWdKD/Chat-GPT-Image-21-de-jun-de-2026-12-46-34.png" alt="Hero" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80 md:bg-gradient-to-r md:from-black/70 md:via-black/40 md:to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 border border-white/20">
              <Zap className="w-3 h-3 md:w-4 md:h-4" /> Plataforma completa de pagamentos
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 md:mb-6">
              Receba pagamentos via <br />
              <span className="bg-gradient-to-r from-go-400 to-emerald-300 bg-clip-text text-transparent">Pix e cartão</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-xl mx-auto md:mx-0 mb-8 md:mb-10">
              Crie links de pagamento e páginas de checkout profissionais em segundos. Compartilhe no WhatsApp, redes sociais ou site.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-go-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-go-600 transition-all shadow-xl shadow-go-500/30">
                Criar Conta Grátis <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <a href="#beneficios" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg border border-white/20 hover:bg-white/20 transition-all">
                Ver Benefícios
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tudo que você precisa para vender</h2>
            <p className="text-xl text-gray-600">Ferramentas completas para criar, gerenciar e receber pagamentos.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="card hover:shadow-lg hover:border-go-200 transition-all duration-300">
                <div className="w-12 h-12 bg-go-50 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-go-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="taxa" className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Taxa Única e Transparente</h2>
          <p className="text-xl text-gray-600 mb-10">Sem mensalidades. Sem pegadinhas. Você só paga quando vende.</p>
          <div className="card inline-block mx-auto !p-12 border-2 border-go-200 bg-gradient-to-br from-white to-go-50">
            <p className="text-sm text-gray-500 mb-2">Taxa por transação</p>
            <div className="text-6xl font-extrabold text-go-600 mb-4">R$ 7</div>
            <p className="text-gray-500 mb-6">por pedido recebido, independente do valor</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-go-500" /> Sem taxa de adesão
              <span className="mx-2">•</span>
              <Check className="w-4 h-4 text-go-500" /> Sem mensalidade
              <span className="mx-2">•</span>
              <Check className="w-4 h-4 text-go-500" /> Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-go-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">Comece a vender agora</h2>
          <p className="text-xl text-white/80 mb-8">Crie sua conta grátis em menos de 1 minuto.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-go-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
            Criar Conta Grátis <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-go-500 to-primary-600 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-white" /></div>
              <span className="text-lg font-bold text-white">GoPay</span>
            </div>
            <p className="text-sm">Plataforma completa de pagamentos para infoprodutores, lojistas e prestadores de serviço.</p>
          </div>
          <div><h4 className="font-semibold text-white mb-3">Produto</h4><ul className="space-y-2 text-sm"><li>Links de Pagamento</li><li>Checkout</li><li>Dashboard</li><li>API</li></ul></div>
          <div><h4 className="font-semibold text-white mb-3">Empresa</h4><ul className="space-y-2 text-sm"><li>Sobre</li><li>Termos</li><li>Privacidade</li></ul></div>
          <div><h4 className="font-semibold text-white mb-3">Suporte</h4><ul className="space-y-2 text-sm"><li>Ajuda</li><li>contato@gopay.com.br</li></ul></div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-8 text-center text-sm">© 2026 GoPay. Todos os direitos reservados.</div>
      </footer>
      <AIChat context="landing-page" />
      <PWAInstall />
    </div>
  );
}
