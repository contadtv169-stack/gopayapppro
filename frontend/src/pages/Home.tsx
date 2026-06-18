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

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-go-50 text-go-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Plataforma completa de pagamentos
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Receba pagamentos via <br />
            <span className="bg-gradient-to-r from-go-500 to-primary-600 bg-clip-text text-transparent">Pix e cartão</span> em minutos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Crie links de pagamento e páginas de checkout profissionais em segundos. Compartilhe no WhatsApp, redes sociais ou site.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg !px-8 !py-4">
              Criar Conta Grátis <ArrowRight className="w-5 h-5 inline ml-2" />
            </Link>
            <a href="#beneficios" className="btn-secondary text-lg !px-8 !py-4">Ver Benefícios</a>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[{ n: '10k+', l: 'Vendedores Ativos' }, { n: 'R$ 2M+', l: 'Processados' }, { n: '99.9%', l: 'Uptime' }, { n: '< 1s', l: 'Confirmação Pix' }].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-gray-900">{s.n}</div>
                <div className="text-gray-500 text-sm">{s.l}</div>
              </div>
            ))}
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
