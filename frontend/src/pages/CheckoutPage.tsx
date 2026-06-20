import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { DollarSign, Copy, CheckCircle, Clock, ArrowLeft, AlertCircle, Loader2, Star, Play, Check } from 'lucide-react';
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
  const installment = (p: any) => Number(p?.price || 0) / 12;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: cfg.primary_color || '#10b981' }} /></div>;
  if (error && !product) return <div className="min-h-screen flex items-center justify-center flex-col"><AlertCircle className="w-16 h-16 text-red-400 mb-4" /><p>{error}</p></div>;

  const bc = cfg.background_color || '#f9fafb';
  const tc = cfg.text_color || '#111827';
  const pc = cfg.primary_color || '#10b981';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bc, color: tc }}>
      <div className="max-w-2xl mx-auto">
        {/* Full-width hero banner - Hotmart style */}
        {!payment && (
          <>
            {cfg.banner_type === 'image' && cfg.banner_url ? (
              <div className="w-full relative">
                <img src={cfg.banner_url} alt="Banner" className="w-full h-72 sm:h-96 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 sm:left-6 right-4">
                  <h1 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg">{product?.name}</h1>
                  <p className="text-white/80 text-sm drop-shadow">{product?.description?.slice(0, 80)}</p>
                </div>
              </div>
            ) : cfg.banner_type === 'color' && cfg.banner_color ? (
              <div className="w-full h-56 sm:h-72 flex items-end p-6" style={{ backgroundColor: cfg.banner_color }}>
                <div>
                  <h1 className="text-white text-2xl sm:text-3xl font-bold">{product?.name}</h1>
                  <p className="text-white/80 text-sm">{product?.description?.slice(0, 80)}</p>
                </div>
              </div>
            ) : cfg.banner_type === 'gradient' ? (
              <div className="w-full h-56 sm:h-72 flex items-end p-6" style={{ background: `linear-gradient(135deg, ${cfg.banner_gradient_start || '#10b981'}, ${cfg.banner_gradient_end || '#6366f1'})` }}>
                <div>
                  <h1 className="text-white text-2xl sm:text-3xl font-bold">{product?.name}</h1>
                  <p className="text-white/80 text-sm">{product?.description?.slice(0, 80)}</p>
                </div>
              </div>
            ) : (
              /* No banner customization - just show product info */
              <div className="px-4 pt-8 pb-2">
                <div className={`flex justify-${cfg.logo_position || 'center'} mb-4`}>
                  {cfg.logo_url ? (
                    <img src={cfg.logo_url} alt="Logo" className="max-h-10 object-contain" />
                  ) : !cfg.white_label ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold">
                      <DollarSign className="w-6 h-6" /> GoPay
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        <div className="px-4 py-6">
          {cfg.logo_url && !payment && cfg.banner_type !== 'image' && cfg.banner_type !== 'color' && cfg.banner_type !== 'gradient' ? null : (
            cfg.logo_url && !payment && (
              <div className={`flex justify-${cfg.logo_position || 'center'} mb-4`}>
                <img src={cfg.logo_url} alt="Logo" className="max-h-10 object-contain" />
              </div>
            )
          )}

          {/* Product page - before payment */}
          {product && !payment && (
            <>
              {/* Only show logo + branding if no banner */}
              {!cfg.banner_type || (cfg.banner_type === 'image' && !cfg.banner_url) ? (
                <div className={`flex justify-${cfg.logo_position || 'center'} mb-4`}>
                  {cfg.logo_url ? (
                    <img src={cfg.logo_url} alt="Logo" className="max-h-10 object-contain" />
                  ) : !cfg.white_label ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold">
                      <DollarSign className="w-6 h-6" /> GoPay
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Product card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-56 sm:h-64 object-cover" />
                )}
                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-1">Autor: {product.user_id?.slice(0, 8) || 'Vendedor'}</p>
                  <h1 className="text-xl font-bold mb-2" style={{ color: tc }}>{product.name}</h1>
                  <p className="text-sm mb-4" style={{ color: tc + 'cc' }}>{product.description}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs text-gray-400">12x de</span>
                    <span className="text-lg font-bold text-gray-400">R$ {installment(product).toFixed(2)}</span>
                  </div>
                  <div className="text-3xl font-extrabold mb-4" style={{ color: pc }}>R$ {Number(product.price).toFixed(2)} à vista</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <Check className="w-3.5 h-3.5 text-go-500" /> Pagamento 100% seguro
                  </div>

                  {cfg.video_url && (
                    <div className="mb-5 aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                      <a href={cfg.video_url} target="_blank" className="flex items-center gap-2" style={{ color: pc }}>
                        <Play className="w-8 h-8" /> <span className="text-sm">Assistir Vídeo</span>
                      </a>
                    </div>
                  )}

                  {cfg.gallery_images?.length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                      {cfg.gallery_images.slice(0, 4).map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="" className="rounded-xl w-full h-24 object-cover" />
                      ))}
                    </div>
                  )}

                  {cfg.reviews_enabled && cfg.reviews?.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
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

              {/* Customer form */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: tc }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Dados pessoais
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input className="input-field" placeholder="Nome completo *" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required />
                  <input className="input-field" placeholder="Email" type="email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
                  <input className="input-field" placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                  <input className="input-field" placeholder="CPF" value={customer.document} onChange={e => setCustomer({...customer, document: e.target.value})} />

                  {/* Payment method */}
                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: tc }}>Pix</p>
                        <p className="text-xs text-gray-500">Pagamento instantâneo</p>
                      </div>
                      <div className="ml-auto w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="submit" disabled={processing} className="w-full flex items-center justify-center gap-2 text-lg !py-4 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: cfg.button_color || '#10b981', color: cfg.button_text_color || '#ffffff' }}>
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Comprar agora'}
                  </button>
                </form>
              </div>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Pagamento seguro</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Dados protegidos</div>
              </div>
            </>
          )}

          {/* Payment/Pix screen */}
          {payment && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {orderStatus === 'paid' ? (
                <div className="py-10 px-6 text-center">
                  <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10 text-go-600" /></div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: tc }}>Pagamento Confirmado!</h2>
                  <p className="text-gray-500">Pedido #{payment.orderId?.slice(0, 8) || payment.id?.slice(0, 8)}</p>
                  {(() => { const url = cfg.redirect_url; if (url) { setTimeout(() => window.location.href = url, 3000); return <p className="text-sm text-gray-400 mt-4">Redirecionando...</p>; } return null; })()}
                </div>
              ) : timeLeft <= 0 ? (
                <div className="py-10 px-6 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: tc }}>Tempo Expirado</h2>
                  <button onClick={() => { setPayment(null); setOrderStatus(''); }} className="btn-primary mt-4">Tentar novamente</button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-center gap-2 text-orange-500 font-medium mb-6"><Clock className="w-5 h-5" /><span>Expira em {fmt(timeLeft)}</span></div>
                  <h3 className="text-lg font-bold text-center mb-4" style={{ color: tc }}>Pague com Pix</h3>
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

          {!cfg.white_label && (
            <div className="text-center pt-4 pb-8">
              <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                GoPay - Pagamento processado com segurança
                <span className="w-1 h-1 rounded-full bg-gray-300" />
              </div>
            </div>
          )}
          <div className="text-center pb-8">
            <Link to="/" className="text-gray-400 text-sm hover:text-gray-600 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
