import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DollarSign, Copy, CheckCircle, Clock, ArrowLeft, AlertCircle, Loader2, Star, Play, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCheckoutProduct, getCheckoutCustomizations, createCheckoutOrder, getOrderStatus } from '../services/checkoutService';

export default function CheckoutPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', document: '' });
  const [payment, setPayment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [orderStatus, setOrderStatus] = useState('');
  const [error, setError] = useState('');

  const cfg = customization || {};

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const p = await getCheckoutProduct(slug);
      if (!p) { setLoading(false); setError('Produto não encontrado'); return; }
      setProduct(p);
      const cust = await getCheckoutCustomizations(p.id);
      setCustomization(cust);
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
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name) return toast.error('Nome é obrigatório');
    setProcessing(true);
    setError('');
    try {
      const order = await createCheckoutOrder({
        product_id: product.id,
        seller_id: product.user_id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_document: customer.document,
        amount: Number(product.price),
      });
      setPayment(order);
      setOrderStatus(order.status);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar');
    } finally { setProcessing(false); }
  };

  const copyPix = () => {
    if (payment?.copyPaste) {
      navigator.clipboard.writeText(payment.copyPaste);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: cfg.primary_color || '#10b981' }} /></div>;
  if (error && !product) return <div className="min-h-screen flex items-center justify-center flex-col"><AlertCircle className="w-16 h-16 text-red-400 mb-4" /><p>{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: cfg.background_color || '#f9fafb' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          {cfg.logo_url ? (
            <div className={`flex justify-${cfg.logo_position || 'center'} mb-2`}>
              <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold">
              <DollarSign className="w-6 h-6" /> GoPay
            </div>
          )}
        </div>

        {product && !payment && (
          <>
            {cfg.banner_type === 'image' && cfg.banner_url && (
              <img src={cfg.banner_url} alt="Banner" className="w-full h-40 object-cover rounded-2xl mb-4" />
            )}
            {cfg.banner_type === 'color' && cfg.banner_color && (
              <div className="w-full h-32 rounded-2xl mb-4" style={{ backgroundColor: cfg.banner_color }} />
            )}
            {cfg.banner_type === 'gradient' && (
              <div className="w-full h-32 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${cfg.banner_gradient_start || '#10b981'}, ${cfg.banner_gradient_end || '#6366f1'})` }} />
            )}

            <div className="card !p-0 overflow-hidden" style={{ backgroundColor: cfg.card_color || '#ffffff' }}>
              {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2" style={{ color: cfg.text_color || '#111827' }}>{product.name}</h1>
                <p className="text-gray-600 mb-4" style={{ color: (cfg.text_color || '#111827') + 'cc' }}>{product.description}</p>
                <div className="text-3xl font-extrabold mb-6" style={{ color: cfg.primary_color || '#10b981' }}>R$ {Number(product.price).toFixed(2)}</div>

                {cfg.video_url && (
                  <div className="mb-6 aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                    <a href={cfg.video_url} target="_blank" className="flex items-center gap-2" style={{ color: cfg.primary_color || '#10b981' }}>
                      <Play className="w-8 h-8" /> <span className="text-sm">Assistir Vídeo</span>
                    </a>
                  </div>
                )}

                {cfg.gallery_images?.length > 0 && (
                  <div className="mb-6 grid grid-cols-2 gap-2">
                    {cfg.gallery_images.slice(0, 4).map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="rounded-xl w-full h-24 object-cover" />
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input className="input-field" placeholder="Nome completo *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required />
                  <input className="input-field" placeholder="Email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                  <input className="input-field" placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                  <input className="input-field" placeholder="CPF" value={customer.document} onChange={e => setCustomer({...customer, document: e.target.value})} />
                  <button type="submit" disabled={processing} className="w-full flex items-center justify-center gap-2 text-lg !py-4 rounded-xl font-bold shadow-lg"
                    style={{ backgroundColor: cfg.button_color || '#10b981', color: cfg.button_text_color || '#ffffff' }}>
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar com Pix'}
                  </button>
                </form>

                {cfg.reviews_enabled && cfg.reviews?.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" /> Avaliações ({cfg.reviews.length})
                    </h3>
                    {cfg.reviews.slice(0, 3).map((r: any, idx: number) => (
                      <div key={idx} className="border-b border-gray-50 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{r.name}</span>
                          <div className="flex">{Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {payment && (
          <div className="card text-center">
            {orderStatus === 'paid' ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-go-600" /></div>
                <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
                <p className="text-gray-600">Pedido #{payment.orderId?.slice(0, 8) || payment.id?.slice(0, 8)}</p>
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
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-2"><Loader2 className="w-4 h-4 animate-spin" /> Aguardando pagamento...</div>
              </>
            )}
          </div>
        )}

        {!cfg.white_label && (
          <div className="text-center mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">GoPay - Pagamento processado com segurança</span>
          </div>
        )}
        <div className="text-center mt-4">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </a>
        </div>
      </div>
    </div>
  );
}
