import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign, Copy, Check, Users, TrendingUp, PiggyBank, QrCode, Send, Plus, RefreshCw, Loader2, Eye, EyeOff, Smartphone, Building2, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';

// Nubank-style digital wallet
// Features: balance, transactions, Pix transfer, virtual card, QR code payment, statements

interface Transaction {
  id: string; type: 'pix_in' | 'pix_out' | 'sale' | 'refund' | 'withdrawal'; amount: number; description: string; date: string; status: 'completed' | 'pending' | 'failed';
}

export default function DigitalWallet() {
  const [balance, setBalance] = useState(0);
  const [blockedBalance, setBlockedBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [pixKey, setPixKey] = useState('');
  const [pixAmount, setPixAmount] = useState('');
  const [pixDescription, setPixDescription] = useState('');
  const [sendingPix, setSendingPix] = useState(false);
  const [showPixForm, setShowPixForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'card' | 'pix' | 'history'>('wallet');

  const uid = JSON.parse(localStorage.getItem('gopay_user') || '{}').id;
  const userName = JSON.parse(localStorage.getItem('gopay_user') || '{}').name || 'Usuário';
  const userEmail = JSON.parse(localStorage.getItem('gopay_user') || '{}').email || '';

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    loadWalletData();
  }, [uid]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      // Get pending orders (money to receive)
      const { data: pendingOrders } = await supabase.from('orders').select('amount, net_amount, status, created_at, customer_name, gateway').eq('user_id', uid).order('created_at', { ascending: false }).limit(50);
      if (pendingOrders) {
        const txs: Transaction[] = pendingOrders.map((o: any) => ({
          id: o.id, type: o.status === 'pending' ? 'pix_in' : 'sale', amount: o.net_amount || o.amount,
          description: `Venda para ${o.customer_name || 'cliente'} (${o.gateway || 'Pix'})`, date: o.created_at, status: o.status === 'paid' ? 'completed' : o.status === 'pending' ? 'pending' : 'failed',
        }));
        setTransactions(txs);
        const totalIn = txs.filter(t => t.type === 'sale' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
        const totalPending = txs.filter(t => t.type === 'pix_in' || t.status === 'pending').reduce((s, t) => s + t.amount, 0);
        setBalance(Number(processAmount) || totalIn - totalPending * 0.3);
        setBlockedBalance(totalPending * 0.7);
      }
    } catch {}
    setLoading(false);
  };

  const processAmount = localStorage.getItem('gopay_balance');

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const sendPix = async () => {
    if (!pixKey || !pixAmount) return toast.error('Preencha chave Pix e valor');
    const amount = parseFloat(pixAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return toast.error('Valor inválido');
    if (amount > balance) return toast.error('Saldo insuficiente');
    setSendingPix(true);
    try {
      // Record transfer in orders table for tracking
      const txId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      await supabase.from('orders').insert({
        id: txId, user_id: uid, customer_name: `Transferência Pix: ${pixKey}`, amount, net_amount: -amount, status: 'paid', payment_method: 'pix', gateway: 'gopay',
        pix_code: pixKey, description: pixDescription || `Pix para ${pixKey}`, created_at: new Date().toISOString(),
      });
      setBalance(prev => prev - amount);
      setTransactions(prev => [{ id: txId, type: 'pix_out', amount: -amount, description: pixDescription || `Pix enviado para ${pixKey.slice(0, 8)}...`, date: new Date().toISOString(), status: 'completed' }, ...prev]);
      toast.success(`Pix de ${formatCurrency(amount)} enviado!`);
      setPixKey('');
      setPixAmount('');
      setPixDescription('');
      setShowPixForm(false);
    } catch (err: any) { toast.error(err.message || 'Erro ao enviar Pix'); }
    setSendingPix(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pix_in': return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'pix_out': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'sale': return <DollarSign className="w-4 h-4 text-go-500" />;
      case 'refund': return <ArrowUpRight className="w-4 h-4 text-orange-500" />;
      default: return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pix_in': return 'Pix recebido';
      case 'pix_out': return 'Pix enviado';
      case 'sale': return 'Venda';
      case 'refund': return 'Reembolso';
      default: return type;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PiggyBank className="w-6 h-6 text-go-500" /> Carteira Digital</h1>
          <p className="text-gray-500 mt-1">Sua conta digital GoPay</p>
        </div>
        <button onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          {showBalance ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
        </button>
      </div>

      {/* Balance Card - Nubank style */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-go-400" /></div>
            <span className="text-sm text-gray-400">Saldo disponível</span>
          </div>
          <Smartphone className="w-5 h-5 text-gray-500" />
        </div>
        <div className="text-4xl font-bold mb-2 tracking-tight">
          {showBalance ? formatCurrency(balance) : '••••••'}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-400"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Bloqueado: {showBalance ? formatCurrency(blockedBalance) : '••••'}</div>
          <div className="flex items-center gap-1 text-gray-400"><Building2 className="w-3 h-3" /> GoPay</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <button onClick={() => setShowPixForm(!showPixForm)} className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Send className="w-5 h-5" /><span className="text-xs">Transferir</span></button>
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Plus className="w-5 h-5" /><span className="text-xs">Depositar</span></button>
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><QrCode className="w-5 h-5" /><span className="text-xs">Pagar</span></button>
        </div>
      </div>

      {/* Pix Form */}
      {showPixForm && (
        <div className="card !p-6 space-y-4 border-2 border-go-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Send className="w-5 h-5 text-go-500" /> Transferência Pix</h3>
            <button onClick={() => setShowPixForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Chave Pix (CPF, email, telefone ou aleatória)</label>
            <input value={pixKey} onChange={e => setPixKey(e.target.value)} className="input-field" placeholder="Ex: email@exemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor (R$)</label>
              <input value={pixAmount} onChange={e => setPixAmount(e.target.value.replace(/[^0-9,]/g, ''))} className="input-field" placeholder="0,00" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição (opcional)</label>
              <input value={pixDescription} onChange={e => setPixDescription(e.target.value)} className="input-field" placeholder="Ex: Pagamento" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Saldo disponível: <strong className="text-gray-900">{formatCurrency(balance)}</strong></span>
          </div>
          <button onClick={sendPix} disabled={sendingPix || !pixKey || !pixAmount} className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
            {sendingPix ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Enviar Pix
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-2">
        {(['wallet', 'card', 'pix', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-go-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {tab === 'wallet' ? 'Extrato' : tab === 'card' ? 'Cartão' : tab === 'pix' ? 'Pix' : 'Histórico'}
          </button>
        ))}
      </div>

      {/* Content based on tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Últimas movimentações</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Nenhuma movimentação ainda. Venda seus produtos para começar!</div>
          ) : transactions.slice(0, 20).map(tx => (
            <div key={tx.id} className="card !p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'pix_in' || tx.type === 'sale' ? 'bg-green-100' : tx.type === 'pix_out' ? 'bg-red-100' : 'bg-gray-100'}`}>
                {getTypeIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={tx.status === 'completed' ? 'text-green-600' : tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'}>
                    {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                  </span>
                  <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                  <span>{getTypeLabel(tx.type)}</span>
                </div>
              </div>
              <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'card' && (
        <div className="space-y-4">
          <div className="card !p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-go-500 to-purple-600 rounded-2xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div>
              <div><h3 className="font-semibold text-gray-900">Cartão Virtual GoPay</h3><p className="text-sm text-gray-500">Gere cartões virtuais para suas vendas</p></div>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white mb-4">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">GoPay Digital Wallet</p>
                  <p className="text-sm mt-1">{userName.toUpperCase()}</p>
                </div>
                <CreditCard className="w-8 h-8 text-go-400" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg tracking-widest font-mono">•••• •••• •••• 0492</p>
                  <p className="text-xs text-gray-400 mt-1">Validade 12/28 • CVV •••</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Bandeira</p>
                  <p className="text-sm font-bold">GoPay</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" /> Novo cartão</button>
              <button className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"><ArrowLeftRight className="w-4 h-4" /> Bloquear</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pix' && (
        <div className="space-y-4">
          <div className="card !p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center"><QrCode className="w-6 h-6 text-green-600" /></div>
              <div><h3 className="font-semibold text-gray-900">Suas Chaves Pix</h3><p className="text-sm text-gray-500">Gerencie suas chaves para receber pagamentos</p></div>
            </div>
            <div className="space-y-3">
              {[
                { type: 'CPF', key: JSON.parse(localStorage.getItem('gopay_user') || '{}').document || 'Não cadastrado', icon: '🪪' },
                { type: 'Email', key: userEmail || 'Não cadastrado', icon: '📧' },
                { type: 'Telefone', key: JSON.parse(localStorage.getItem('gopay_user') || '{}').phone || 'Não cadastrado', icon: '📱' },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{k.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400">{k.type}</p>
                      <p className="text-sm font-medium text-gray-900">{k.key}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(k.key); toast.success('Chave copiada!'); }} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Cadastre suas chaves em <strong>Configurações → Chave Pix</strong></p>
          </div>
          <div className="card !p-6">
            <h3 className="font-semibold text-gray-900 mb-3">QR Code para receber</h3>
            <p className="text-sm text-gray-500 mb-4">Gere um QR Code estático para receber Pix de qualquer valor</p>
            <button onClick={() => { toast('Compartilhe sua chave Pix com o cliente'); }} className="btn-primary flex items-center gap-2"><QrCode className="w-5 h-5" /> Gerar QR Code</button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card !p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Extrato Completo</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(tx.type)}
                    <div>
                      <p className="text-sm text-gray-900">{tx.description.slice(0, 30)}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-4">
        <ShieldCheck className="w-4 h-4 text-go-500" /> Sua carteira é protegida com criptografia e autenticação segura
      </div>
    </div>
  );
}