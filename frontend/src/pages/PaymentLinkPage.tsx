import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DollarSign, Copy, CheckCircle, Clock, ArrowLeft, AlertCircle, Loader2, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCheckoutLink, createCheckoutOrder, getOrderStatus, getConnectedGateways } from '../services/checkoutService';

const GATEWAY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  kryptgateway: { name: 'KryptGateway', icon: '🔐', color: '#6366f1' },
  abacatepay: { name: 'AbacatePay', icon: '🥑', color: '#22c55e' },
  pixgo: { name: 'PixGo', icon: '💳', color: '#f59e0b' },
  gopay: { name: 'Pix GoPay', icon: '💚', color: '#10b981' },
};

export default function PaymentLinkPage() {
  const { slug } = useParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', document: '' });
  const [payment, setPayment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [orderStatus, setOrderStatus] = useState('');
  const [error, setError] = useState('');
  const [availableGateways, setAvailableGateways] = useState<any[]>([]);
  const [selectedGateway, setSelectedGateway] = useState('gopay');
  const [loadingGateways, setLoadingGateways] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const l = await getCheckoutLink(slug);
      if (!l) { setLoading(false); setError('Link não encontrado'); return; }
      setLink(l);
      if (l?.user_id) {
        const gws = await getConnectedGateways(l.user_id);
        setAvailableGateways(gws);
        if (gws.length > 0) setSelectedGateway(gws[0].gateway);
      }
      setLoading(false);
      setLoadingGateways(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!payment || orderStatus === 'paid') return;
    const interval = setInterval(async () => {
      const s = await getOrderStatus(payment.orderId);
      setOrderStatus(s);
      if (s === 'paid') clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [payment, orderStatus]);

  useEffect(() => {
    if (!payment?.expiresAt) return;
    const end = new Date(payment.expiresAt).getTime();
    const interval = setInterval(() => { setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000))); }, 1000);
    return () => clearInterval(interval);
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name) return toast.error('Nome é obrigatório');
    setProcessing(true);
    setError('');
    try {
      const order = await createCheckoutOrder({
        payment_link_id: link.id,
        seller_id: link.user_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_document: customer.document,
        amount: Number(link.amount),
        preferred_gateway: selectedGateway !== 'gopay' ? selectedGateway : undefined,
      });
      setPayment(order);
      setOrderStatus(order.status);
    } catch (err: any) { setError(err.message || 'Erro ao processar'); } finally { setProcessing(false); }
  };

  const copyPix = () => {
    if (payment?.copyPaste) {
      navigator.clipboard.writeText(payment.copyPaste);
      setCopied(true); toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const installment = (v: number) => v / 12;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;
  if (error && !link) return <div className="min-h-screen flex items-center justify-center flex-col"><AlertCircle className="w-16 h-16 text-red-400 mb-4" /><p>{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {link && !payment && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold"><DollarSign className="w-6 h-6" /> GoPay</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
              <div className="p-5">
                <h1 className="text-xl font-bold mb-2">{link.title}</h1>
                {link.description && <p className="text-sm text-gray-500 mb-4">{link.description}</p>}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs text-gray-400">12x de</span>
                  <span className="text-lg font-bold text-gray-400">R$ {installment(Number(link.amount)).toFixed(2)}</span>
                </div>
                <div className="text-3xl font-extrabold mb-2" style={{ color: '#10b981' }}>R$ {Number(link.amount).toFixed(2)} à vista</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Dados pessoais
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input className="input-field" placeholder="Nome completo *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required />
                <input className="input-field" placeholder="Email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                <input className="input-field" placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                <input className="input-field" placeholder="CPF" value={customer.document} onChange={e => setCustomer({...customer, document: e.target.value})} />

                {loadingGateways ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando formas de pagamento...</div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium text-gray-700">Forma de Pagamento</p>
                    {availableGateways.map((gw: any) => {
                      const meta = GATEWAY_INFO[gw.gateway] || { name: gw.gateway, icon: '🔗', color: '#6b7280' };
                      return (
                        <label key={gw.gateway} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedGateway === gw.gateway ? 'border-go-500 bg-go-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <input type="radio" name="gateway" value={gw.gateway} checked={selectedGateway === gw.gateway} onChange={() => setSelectedGateway(gw.gateway)} className="hidden" />
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: meta.color + '20' }}><span>{meta.icon}</span></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{meta.name}</p>
                            <p className="text-xs text-gray-500">Pagamento via Pix processado por {meta.name}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedGateway === gw.gateway ? 'border-go-500' : 'border-gray-300'}`}>
                            {selectedGateway === gw.gateway && <div className="w-2.5 h-2.5 rounded-full bg-go-500" />}
                          </div>
                        </label>
                      );
                    })}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedGateway === 'gopay' ? 'border-go-500 bg-go-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                      <input type="radio" name="gateway" value="gopay" checked={selectedGateway === 'gopay'} onChange={() => setSelectedGateway('gopay')} className="hidden" />
                      <div className="w-10 h-10 bg-go-100 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-go-600" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Pix GoPay</p>
                        <p className="text-xs text-gray-500">Pagamento instantâneo processado pelo GoPay</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedGateway === 'gopay' ? 'border-go-500' : 'border-gray-300'}`}>
                        {selectedGateway === 'gopay' && <div className="w-2.5 h-2.5 rounded-full bg-go-500" />}
                      </div>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1"><ShieldCheck className="w-3.5 h-3.5 text-go-500" /> Pagamento 100% seguro</div>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={processing} className="w-full flex items-center justify-center gap-2 text-lg !py-4 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#10b981', color: '#ffffff' }}>
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Comprar agora'}
                </button>
              </form>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
              <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Pagamento seguro</div>
              <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Dados protegidos</div>
            </div>
          </>
        )}

        {payment && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {orderStatus === 'paid' ? (
              <div className="py-10 px-6 text-center">
                <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-go-600" /></div>
                <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
              </div>
            ) : timeLeft <= 0 ? (
              <div className="py-10 px-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                <h2 className="text-2xl font-bold mb-2">Tempo Expirado</h2>
                <button onClick={() => { setPayment(null); setOrderStatus(''); }} className="btn-primary mt-4">Tentar novamente</button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-center gap-2 text-orange-500 font-medium mb-6"><Clock className="w-5 h-5" /><span>Expira em {fmt(timeLeft)}</span></div>
                <h3 className="text-lg font-bold text-center mb-4">Pague com Pix</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Escaneie o QR Code abaixo com seu banco</p>
                {payment.qrCodeBase64 ? (
                  <img src={payment.qrCodeBase64} alt="QR Code Pix" className="w-52 h-52 mx-auto mb-6 rounded-2xl shadow-sm border p-2" />
                ) : (
                  <div className="w-52 h-52 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center border">
                    <DollarSign className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {payment.copyPaste && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-2">Código Pix Copia e Cola</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded-lg border truncate font-mono">{payment.copyPaste}</code>
                      <button onClick={copyPix} className="bg-go-500 text-white p-2 rounded-lg hover:bg-go-600 flex-shrink-0">
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-center border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500">Valor: <strong className="text-gray-900">R$ {Number(payment.amount).toFixed(2)}</strong></p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2"><Loader2 className="w-4 h-4 animate-spin" /> Aguardando pagamento...</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 mb-4">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            GoPay - Pagamento processado com segurança
            <span className="w-1 h-1 rounded-full bg-gray-300" />
          </div>
          <Link to="/" className="text-gray-400 text-sm hover:text-gray-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}