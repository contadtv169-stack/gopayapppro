import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DollarSign, Copy, CheckCircle, Clock, ArrowLeft, AlertCircle, Loader2, ShieldCheck, Star, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { getCheckoutProduct, getCheckoutCustomizations, createCheckoutOrder, getOrderStatus, getSellerProfile } from '../services/checkoutService';

export default function CheckoutPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [sellerName, setSellerName] = useState('Vendedor');
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', document: '' });
  const [payment, setPayment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200);
  const [orderStatus, setOrderStatus] = useState('');
  const [error, setError] = useState('');

  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizDone, setQuizDone] = useState(false);

  const cfg = customization || {};

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const p = await getCheckoutProduct(slug);
      if (!p) { setLoading(false); setError('Produto não encontrado'); return; }
      setProduct(p);
      const cust = await getCheckoutCustomizations(p.id);
      setCustomization(cust);
      if (p?.user_id) {
        const name = await getSellerProfile(p.user_id);
        setSellerName(name);
      }
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
        {!payment && (
          <>
            {cfg.banner_type === 'image' && cfg.banner_url ? (
              <div className="w-full relative min-h-[90vh] flex items-center justify-center">
                <img src={cfg.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  {cfg.logo_url ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" /> : !cfg.white_label ? (
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-white/20"><DollarSign className="w-4 h-4" /> GoPay</div>
                  ) : null}
                </div>
                <div className="relative z-10 text-center px-4 max-w-xl mx-auto">
                  <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold drop-shadow-lg mb-3">{product?.name}</h1>
                  <p className="text-white/80 text-base sm:text-lg drop-shadow">{product?.description?.slice(0, 120)}</p>
                </div>
              </div>
            ) : cfg.banner_type === 'color' && cfg.banner_color ? (
              <div className="w-full min-h-[70vh] flex items-center justify-center relative" style={{ backgroundColor: cfg.banner_color }}>
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  {cfg.logo_url ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" /> : !cfg.white_label ? <div className="inline-flex items-center gap-1.5 bg-black/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium"><DollarSign className="w-4 h-4" /> GoPay</div> : null}
                </div>
                <div className="text-center px-4">
                  <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">{product?.name}</h1>
                  <p className="text-white/80 text-base">{product?.description?.slice(0, 120)}</p>
                </div>
              </div>
            ) : cfg.banner_type === 'gradient' ? (
              <div className="w-full min-h-[70vh] flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${cfg.banner_gradient_start || '#10b981'}, ${cfg.banner_gradient_end || '#6366f1'})` }}>
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  {cfg.logo_url ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" /> : !cfg.white_label ? <div className="inline-flex items-center gap-1.5 bg-black/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium"><DollarSign className="w-4 h-4" /> GoPay</div> : null}
                </div>
                <div className="text-center px-4">
                  <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">{product?.name}</h1>
                  <p className="text-white/80 text-base">{product?.description?.slice(0, 120)}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 pt-8 pb-2">
                <div className={`flex justify-${cfg.logo_position || 'center'} mb-4`}>
                  {cfg.logo_url ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" /> : !cfg.white_label ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold"><DollarSign className="w-6 h-6" /> GoPay</div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        <div className="px-4 py-6">
          {product && !payment && cfg.landing_sections?.length > 0 && !quizDone && cfg.landing_sections.filter((s: any) => s.enabled !== false).map((section: any, idx: number) => (
            <div key={section.id || idx} className="w-full" style={{ backgroundColor: section.bg_color || '#ffffff', color: section.text_color || '#111827', minHeight: section.type === 'hero' ? '100vh' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className={`w-full ${section.type === 'hero' ? 'min-h-screen relative flex items-center justify-center' : 'py-16 px-4 max-w-4xl mx-auto'}`}>
                {section.type === 'hero' && section.image_url ? (
                  <div className="absolute inset-0"><img src={section.image_url} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50" /></div>
                ) : null}
                <div className={`relative z-10 ${section.type === 'hero' ? 'text-center px-6 py-20 max-w-2xl mx-auto' : ''}`}>
                  {section.image_url && section.type !== 'hero' && <img src={section.image_url} alt="" className="w-full max-h-64 object-cover rounded-2xl mb-6 shadow-lg" />}
                  {section.title && <h2 className={`font-bold mb-3 ${section.type === 'hero' ? 'text-4xl sm:text-5xl lg:text-6xl leading-tight' : section.type === 'features' ? 'text-2xl text-center' : 'text-2xl'}`} style={{ color: section.text_color || '#111827' }}>{section.title}</h2>}
                  {section.subtitle && <p className={`mb-4 ${section.type === 'hero' ? 'text-lg sm:text-xl opacity-80' : 'text-base opacity-70'}`} style={{ color: section.text_color || '#111827' }}>{section.subtitle}</p>}
                  {section.content && <p className="text-sm opacity-70 mb-6 max-w-xl mx-auto" style={{ color: section.text_color || '#111827' }}>{section.content}</p>}
                  {section.type === 'features' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                          <div className="w-12 h-12 rounded-xl bg-white/20 mx-auto mb-3 flex items-center justify-center text-xl">⭐</div>
                          <h4 className="font-semibold mb-2">Recurso {i}</h4>
                          <p className="text-sm opacity-70">Descrição do recurso incrível que vai transformar seus resultados.</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.button_text && (
                    <button onClick={() => { setQuizDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform"
                      style={{ backgroundColor: section.button_color || '#22c55e', color: section.button_text_color || '#ffffff' }}>
                      {section.button_text}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {product && !payment && cfg.quiz_enabled && cfg.quiz_questions?.length > 0 && !quizDone && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <h2 className="text-xl font-bold mb-1" style={{ color: tc }}>{cfg.quiz_title || 'Antes de continuar...'}</h2>
              <p className="text-sm text-gray-500 mb-6">Responda algumas perguntas</p>
              {cfg.quiz_questions.map((q: any, idx: number) => (
                <div key={q.id || idx} className={`mb-5 ${quizStep === idx ? '' : 'hidden'}`}>
                  <p className="font-medium mb-3 text-sm" style={{ color: tc }}>{idx + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt: string, oi: number) => (
                      <label key={oi} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${quizAnswers[q.id || idx] === opt ? 'border-go-500 bg-go-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name={`quiz_${idx}`} value={opt} checked={quizAnswers[q.id || idx] === opt} onChange={() => setQuizAnswers({ ...quizAnswers, [q.id || idx]: opt })} className="hidden" />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${quizAnswers[q.id || idx] === opt ? 'border-go-500' : 'border-gray-300'}`}>
                          {quizAnswers[q.id || idx] === opt && <div className="w-2.5 h-2.5 rounded-full bg-go-500" />}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setQuizStep(Math.max(0, idx - 1))} className={`text-sm text-gray-400 hover:text-gray-600 ${idx === 0 ? 'invisible' : ''}`}>Voltar</button>
                    {idx < cfg.quiz_questions.length - 1 ? (
                      <button onClick={() => { if (quizAnswers[q.id || idx]) setQuizStep(idx + 1); else toast.error('Selecione uma opção'); }} className="btn-primary text-sm !py-2">Próximo</button>
                    ) : (
                      <button onClick={() => { if (quizAnswers[q.id || idx]) setQuizDone(true); else toast.error('Selecione uma opção'); toast.success('Quiz concluído! Agora finalize sua compra.'); }} className="btn-primary text-sm !py-2">Ver produto</button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-1 text-xs text-gray-400 justify-center mt-2">
                {cfg.quiz_questions.map((_: any, i: number) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === quizStep ? 'bg-go-500' : i < quizStep || quizDone ? 'bg-gray-300' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          )}

          {product && !payment && (!cfg.quiz_enabled || !cfg.quiz_questions?.length || quizDone) && (
            <>
              {!cfg.banner_type || (cfg.banner_type === 'image' && !cfg.banner_url) ? (
                <div className={`flex justify-${cfg.logo_position || 'center'} mb-4`}>
                  {cfg.logo_url ? <img src={cfg.logo_url} alt="Logo" className="max-h-12 object-contain" /> : !cfg.white_label ? (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-br from-go-500 to-primary-600 text-white px-4 py-2 rounded-xl text-lg font-bold"><DollarSign className="w-6 h-6" /> GoPay</div>
                  ) : null}
                </div>
              ) : null}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
                {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-56 sm:h-64 object-cover" />}
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-1">{sellerName}</p>
                  <h1 className="text-xl font-bold mb-2" style={{ color: tc }}>{product.name}</h1>
                  <p className="text-sm mb-4" style={{ color: tc + 'cc' }}>{product.description}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs text-gray-400">12x de</span>
                    <span className="text-lg font-bold text-gray-400">R$ {installment(product).toFixed(2)}</span>
                  </div>
                  <div className="text-3xl font-extrabold mb-4" style={{ color: pc }}>R$ {Number(product.price).toFixed(2)} à vista</div>

                  {(cfg.video_url && !cfg.gallery_images?.length) ? (
                    <div className="mb-5 aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      {cfg.video_url.includes('youtube.com') || cfg.video_url.includes('youtu.be') ? (
                        <iframe src={cfg.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
                      ) : cfg.video_url.includes('vimeo.com') ? (
                        <iframe src={cfg.video_url.replace('vimeo.com', 'player.vimeo.com/video')} className="w-full h-full" allowFullScreen />
                      ) : (
                        <a href={cfg.video_url} target="_blank" className="w-full h-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                          <Play className="w-12 h-12 text-gray-400" />
                        </a>
                      )}
                    </div>
                  ) : null}

                  {cfg.gallery_images?.length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                      {cfg.gallery_images.slice(0, 6).map((item: any, idx: number) => (
                        typeof item === 'string' ? (
                          <img key={idx} src={item} alt="" className="rounded-xl w-full h-24 object-cover" />
                        ) : item?.type === 'video' ? (
                          <div key={idx} className="rounded-xl w-full h-24 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                            {item.thumbnail ? <img src={item.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" /> : null}
                            <Play className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
                          </div>
                        ) : (
                          <img key={idx} src={item?.url || item} alt="" className="rounded-xl w-full h-24 object-cover" />
                        )
                      ))}
                    </div>
                  )}

                  {cfg.reviews_enabled && cfg.reviews?.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" /> Avaliações ({cfg.reviews.length})
                      </h3>
                      <div className="space-y-3">
                        {cfg.reviews.slice(0, 5).map((r: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-50 pb-3">
                            <div className="flex items-center gap-2 mb-1">
                              {r.avatar ? <img src={r.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">{r.name?.[0]}</div>}
                              <span className="text-sm font-medium">{r.name}</span>
                              <div className="flex">{Array.from({length: 5}).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}</div>
                            </div>
                            {r.photo && <img src={r.photo} alt="Review" className="w-20 h-20 rounded-xl object-cover mb-1" />}
                            <p className="text-xs text-gray-500">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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

                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-go-500 bg-go-50">
                    <div className="w-10 h-10 bg-go-100 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-go-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: tc }}>Pix GoPay</p>
                      <p className="text-xs text-gray-500">Pagamento instantâneo via Pix</p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-go-500" />
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <button type="submit" disabled={processing} className="w-full flex items-center justify-center gap-2 text-lg !py-4 rounded-xl font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: cfg.button_color || '#10b981', color: cfg.button_text_color || '#ffffff' }}>
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar com Pix'}
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-6">
                <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-go-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Pagamento seguro</div>
                <div className="flex items-center gap-1.5"><svg className="w-3 h-3 text-go-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Dados protegidos</div>
              </div>
            </>
          )}

          {payment && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {orderStatus === 'paid' ? (
                <div className="py-10 px-6 text-center">
                  <div className="w-20 h-20 bg-go-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-go-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: tc }}>Pagamento Confirmado!</h2>
                  <p className="text-gray-500">Pedido #{payment.orderId?.slice(0, 8) || payment.id?.slice(0, 8)}</p>
                  <p className="text-sm text-gray-400 mt-4">Você receberá seu produto em breve.</p>
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
                    <div className="w-52 h-52 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center border"><DollarSign className="w-16 h-16 text-gray-300" /></div>
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