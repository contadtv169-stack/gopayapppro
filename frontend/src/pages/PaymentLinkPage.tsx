import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, Copy, CheckCircle, Clock, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCheckoutLink, createCheckoutOrder, getOrderStatus } from '../services/checkoutService';

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

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const l = await getCheckoutLink(slug);
      if (!l) { setLoading(false); setError('Link não encontrado'); return; }
      setLink(l);
      setLoading(false);
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
    try {
      const order = await createCheckoutOrder({
        payment_link_id: link.id,
        seller_id: link.user_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_document: customer.document,
        amount: Number(link.amount),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;
  if (error && !link) return <div className="min-h-screen flex items-center justify-center flex-col"><AlertCircle className="w-16 h-16 text-red-400 mb-4" /><p>{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold"><DollarSign className="w-6 h-6" /> GoPay</div>
        </div>
        {link && !payment && (
          <div className="card">
            <h1 className="text-2xl font-bold mb-2">{link.title}</h1>
            {link.description && <p className="text-gray-600 mb-4">{link.description}</p>}
            <div className="text-3xl font-extrabold mb-6">R$ {Number(link.amount).toFixed(2)}</div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input-field" placeholder="Nome completo *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required />
              <input className="input-field" placeholder="Email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
              <input className="input-field" placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
              <input className="input-field" placeholder="CPF" value={customer.document} onChange={e => setCustomer({...customer, document: e.target.value})} />
              <button type="submit" disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2 text-lg !py-4">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar com Pix'}
              </button>
            </form>
          </div>
        )}
        {payment && (
          <div className="card text-center">
            {orderStatus === 'paid' ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-go-600" /></div>
                <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
              </div>
            ) : timeLeft <= 0 ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                <h2 className="text-2xl font-bold mb-2">Tempo Expirado</h2>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-orange-500 font-medium mb-4"><Clock className="w-5 h-5" /><span>Expira em {fmt(timeLeft)}</span></div>
                <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-16 h-16 text-gray-300" />
                </div>
                {payment.copyPaste && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-2">Código Pix Copia e Cola</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded-lg border truncate">{payment.copyPaste}</code>
                      <button onClick={copyPix} className="bg-go-500 text-white p-2 rounded-lg hover:bg-go-600 flex-shrink-0">
                        {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500">Valor: <strong>R$ {Number(payment.amount).toFixed(2)}</strong></div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2"><Loader2 className="w-4 h-4 animate-spin" /> Aguardando...</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
