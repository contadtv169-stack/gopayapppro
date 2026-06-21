import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Palette, Image, Type, Video, Layout, Star, HelpCircle, 
  Eye, EyeOff, Save, Upload, Plus, Trash2,
  ChevronDown, ChevronUp, Monitor, Smartphone, 
  X, Check, Play, Link, Loader2, DollarSign, Package, Crop
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AIChat } from '../../components/AIChat';
import PhotoEditorPro from '../../components/PhotoEditorPro';
import { getProducts } from '../../services/supabaseData';
import { supabase } from '../../services/supabase';

type Tab = 'banner' | 'logo' | 'video' | 'quiz' | 'gallery' | 'reviews' | 'colors' | 'photoshop' | 'advanced';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'banner', label: 'Banner', icon: Image },
  { id: 'logo', label: 'Logo', icon: Type },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'gallery', label: 'Galeria', icon: Layout },
  { id: 'reviews', label: 'Avaliações', icon: Star },
  { id: 'colors', label: 'Cores', icon: Palette },
  { id: 'photoshop', label: 'Photoshop', icon: Image },
  { id: 'advanced', label: 'Avançado', icon: Eye },
];

const galleryTemplates = [
  { id: 'demo1', url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400', label: 'Escritório' },
  { id: 'demo2', url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=400', label: 'Produto' },
  { id: 'demo3', url: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=400', label: 'Equipe' },
  { id: 'demo4', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', label: 'Apresentação' },
  { id: 'demo5', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400', label: 'Tecnologia' },
  { id: 'demo6', url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', label: 'Negócios' },
];

const defaultQuizQuestions = [
  { id: '1', question: 'Como você nos conheceu?', options: ['Instagram', 'WhatsApp', 'Indicação', 'Google'], type: 'single' },
  { id: '2', question: 'Qual seu maior desafio?', options: ['Tempo', 'Dinheiro', 'Conhecimento', 'Ferramentas'], type: 'single' },
];

export default function Editor() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product') || 'all';
  const [activeTab, setActiveTab] = useState<Tab>('banner');
  const [preview, setPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(productId);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState({
    white_label: false,
    hide_gopay_branding: false,
    logo_url: '',
    logo_position: 'center',
    banner_url: '',
    banner_type: 'image',
    banner_color: '#22c55e',
    banner_gradient_start: '#22c55e',
    banner_gradient_end: '#6366f1',
    redirect_url: '',
    affiliate_link: '',
    video_url: '',
    video_autoplay: false,
    video_loop: false,
    quiz_enabled: false,
    quiz_title: 'Antes de continuar...',
    quiz_questions: defaultQuizQuestions,
    gallery_images: [] as string[],
    gallery_layout: 'grid',
    reviews_enabled: false,
    reviews: [] as any[],
    primary_color: '#22c55e',
    secondary_color: '#6366f1',
    background_color: '#ffffff',
    text_color: '#111827',
    button_color: '#22c55e',
    button_text_color: '#ffffff',
    custom_css: '',
    custom_js: '',
    theme: 'default',
  });

  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Photo editor state
  const [photoEditor, setPhotoEditor] = useState<{ open: boolean; url: string; idx?: number }>({ open: false, url: '' });

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'all') {
      (async () => {
        try {
          const { data }: any = await supabase.from('customizations').select('*').eq('product_id', selectedProduct).maybeSingle();
          if (data) setConfig(prev => ({ ...prev, ...data }));
        } catch {}
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [selectedProduct]);

  const save = async () => {
    if (selectedProduct === 'all') return toast.error('Selecione um produto para personalizar');
    setSaving(true);
    try {
      const uid = JSON.parse(localStorage.getItem('gopay_user') || '{}').id;
      await supabase.from('customizations').upsert({ product_id: selectedProduct, user_id: uid, ...config });
      await supabase.from('products').update({ is_active: true, checkout_url: `${window.location.origin}/gopayapppro/#/checkout/product/${selectedProduct}` }).eq('id', selectedProduct);
      toast.success('Checkout salvo e produto publicado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const addGalleryImage = (url?: string) => {
    const img = url || newGalleryUrl;
    if (img) {
      setConfig({ ...config, gallery_images: [...config.gallery_images, img] });
      setNewGalleryUrl('');
    }
  };

  const addReview = () => {
    if (newReview.name && newReview.comment) {
      setConfig({ ...config, reviews: [...config.reviews, { ...newReview, id: Date.now(), date: new Date().toISOString() }] });
      setNewReview({ name: '', rating: 5, comment: '' });
    }
  };

  const removeGallery = (idx: number) => {
    setConfig({ ...config, gallery_images: config.gallery_images.filter((_, i) => i !== idx) });
  };

  const removeReview = (idx: number) => {
    setConfig({ ...config, reviews: config.reviews.filter((_, i) => i !== idx) });
  };

  const openPhotoEditor = (url: string, idx?: number) => {
    setPhotoEditor({ open: true, url, idx });
  };

  const saveEditedPhoto = (dataUrl: string) => {
    if (photoEditor.idx !== undefined) {
      const imgs = [...config.gallery_images];
      imgs[photoEditor.idx] = dataUrl;
      setConfig({ ...config, gallery_images: imgs });
    } else {
      setConfig({ ...config, banner_url: dataUrl });
    }
    setPhotoEditor({ open: false, url: '' });
    toast.success('Imagem editada!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tab: 'gallery' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (tab === 'banner') {
        setConfig({ ...config, banner_url: url, banner_type: 'image' });
      } else {
        addGalleryImage(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedProductData = products.find(p => String(p.id) === String(selectedProduct));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Editor de Checkout</h1>
          <span className="bg-go-50 text-go-700 text-xs px-3 py-1 rounded-full font-medium self-start">Produção</span>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="input-field !py-1.5 !px-3 text-sm w-full sm:max-w-[200px]">
            <option value="all">Selecione um produto...</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => setPreview(!preview)} className={`btn-secondary !py-1.5 !px-3 text-xs sm:text-sm flex items-center gap-1.5 ${preview ? 'bg-go-50 text-go-700 border-go-200' : ''}`}>
            {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {preview ? 'Editar' : 'Prévia'}
          </button>
          <button onClick={save} disabled={saving || selectedProduct === 'all'} className="btn-primary !py-1.5 !px-3 text-xs sm:text-sm flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Publicar
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left sidebar - tabs */}
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto lg:w-48 xl:w-56 flex-shrink-0 pb-2 lg:pb-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id ? 'bg-go-50 text-go-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
          <div className="hidden lg:block border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">White Label</p>
                <p className="text-xs text-gray-500">Remover marca GoPay</p>
              </div>
              <button onClick={() => setConfig({ ...config, white_label: !config.white_label })}
                className={`w-10 h-6 rounded-full transition-colors ${config.white_label ? 'bg-go-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.white_label ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Editor panel */}
          <div className={`${preview ? 'hidden lg:flex' : 'flex'} flex-col flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-0`}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Banner tab */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Banner Principal</h2>
                  <p className="text-sm text-gray-500">O banner aparece no topo da página de checkout ocupando toda a largura</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['image', 'color', 'gradient'].map(type => (
                      <button key={type} onClick={() => setConfig({ ...config, banner_type: type })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          config.banner_type === type ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                        {type === 'image' ? 'Imagem' : type === 'color' ? 'Cor Sólida' : 'Gradiente'}
                      </button>
                    ))}
                  </div>
                  {config.banner_type === 'image' && (
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">URL da Imagem</label>
                      <div className="flex gap-2">
                        <input className="input-field flex-1" placeholder="https://..." value={config.banner_url} onChange={e => setConfig({ ...config, banner_url: e.target.value })} />
                        <label className="btn-secondary !py-2 !px-3 cursor-pointer flex items-center"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'banner')} className="hidden" /></label>
                      </div>
                      {config.banner_url && (
                        <div className="mt-3 relative rounded-xl overflow-hidden border">
                          <img src={config.banner_url} alt="Banner" className="w-full h-40 object-cover" />
                          <button onClick={() => openPhotoEditor(config.banner_url)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg shadow hover:bg-white"><Crop className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  )}
                  {config.banner_type === 'color' && (
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={config.banner_color} onChange={e => setConfig({ ...config, banner_color: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border" />
                        <span className="text-sm text-gray-500">{config.banner_color}</span>
                      </div>
                    </div>
                  )}
                  {config.banner_type === 'gradient' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-gray-600 mb-1 block">Cor Inicial</label><div className="flex items-center gap-3"><input type="color" value={config.banner_gradient_start} onChange={e => setConfig({ ...config, banner_gradient_start: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border" /><span className="text-sm text-gray-500">{config.banner_gradient_start}</span></div></div>
                      <div><label className="text-sm text-gray-600 mb-1 block">Cor Final</label><div className="flex items-center gap-3"><input type="color" value={config.banner_gradient_end} onChange={e => setConfig({ ...config, banner_gradient_end: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border" /><span className="text-sm text-gray-500">{config.banner_gradient_end}</span></div></div>
                    </div>
                  )}
                </div>
              )}

              {/* Logo tab */}
              {activeTab === 'logo' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Logo</h2>
                  <div><label className="text-sm text-gray-600 mb-1 block">URL da Logo</label><input className="input-field" placeholder="https://..." value={config.logo_url} onChange={e => setConfig({ ...config, logo_url: e.target.value })} /></div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Posição</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['left', 'center', 'right'].map(pos => (
                        <button key={pos} onClick={() => setConfig({ ...config, logo_position: pos })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${config.logo_position === pos ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'}`}>
                          {pos === 'left' ? 'Esquerda' : pos === 'center' ? 'Centro' : 'Direita'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.logo_url && <div className="border border-gray-200 rounded-xl p-4 bg-gray-50"><p className="text-xs text-gray-400 mb-2">Prévia:</p><img src={config.logo_url} alt="Logo" className="max-h-16 object-contain mx-auto" /></div>}
                </div>
              )}

              {/* Video tab */}
              {activeTab === 'video' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Vídeo</h2>
                  <div><label className="text-sm text-gray-600 mb-1 block">URL do Vídeo (YouTube/Vimeo)</label><input className="input-field" placeholder="https://youtube.com/watch?v=..." value={config.video_url} onChange={e => setConfig({ ...config, video_url: e.target.value })} /></div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={config.video_autoplay} onChange={e => setConfig({ ...config, video_autoplay: e.target.checked })} className="w-4 h-4 text-go-500 rounded" /><span className="text-sm">Autoplay</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={config.video_loop} onChange={e => setConfig({ ...config, video_loop: e.target.checked })} className="w-4 h-4 text-go-500 rounded" /><span className="text-sm">Loop</span></label>
                  </div>
                </div>
              )}

              {/* Quiz tab */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Quiz</h2>
                    <label className="flex items-center gap-2 cursor-pointer"><span className="text-sm">Ativar</span>
                      <button onClick={() => setConfig({ ...config, quiz_enabled: !config.quiz_enabled })} className={`w-10 h-6 rounded-full transition-colors ${config.quiz_enabled ? 'bg-go-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.quiz_enabled ? 'translate-x-5' : 'translate-x-1'}`} /></button>
                    </label>
                  </div>
                  {config.quiz_enabled && (
                    <>
                      <div><label className="text-sm text-gray-600 mb-1 block">Título</label><input className="input-field" value={config.quiz_title} onChange={e => setConfig({ ...config, quiz_title: e.target.value })} /></div>
                      {config.quiz_questions.map((q: any, idx: number) => (
                        <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium">Pergunta {idx + 1}</span>
                            <button onClick={() => setConfig({ ...config, quiz_questions: config.quiz_questions.filter((_: any, i: number) => i !== idx) })} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <input className="input-field mb-3" value={q.question} onChange={e => { const qs = [...config.quiz_questions]; qs[idx] = { ...qs[idx], question: e.target.value }; setConfig({ ...config, quiz_questions: qs }); }} placeholder="Digite a pergunta" />
                          <div className="space-y-2">
                            {q.options.map((opt: string, oi: number) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input className="input-field flex-1 text-sm" value={opt} onChange={e => { const qs = [...config.quiz_questions]; qs[idx].options[oi] = e.target.value; setConfig({ ...config, quiz_questions: qs }); }} />
                                <button onClick={() => { const qs = [...config.quiz_questions]; qs[idx].options.splice(oi, 1); setConfig({ ...config, quiz_questions: qs }); }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                            <button onClick={() => { const qs = [...config.quiz_questions]; qs[idx].options.push(''); setConfig({ ...config, quiz_questions: qs }); }} className="text-sm text-go-600 hover:text-go-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar opção</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setConfig({ ...config, quiz_questions: [...config.quiz_questions, { id: String(Date.now()), question: '', options: ['', ''], type: 'single' }] })} className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar Pergunta</button>
                    </>
                  )}
                </div>
              )}

              {/* Gallery tab */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Galeria de Imagens</h2>
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="URL da imagem" value={newGalleryUrl} onChange={e => setNewGalleryUrl(e.target.value)} />
                    <button onClick={() => addGalleryImage()} className="btn-primary !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /></button>
                    <label className="btn-secondary !py-2 !px-3 cursor-pointer"><Upload className="w-4 h-4" /><input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'gallery')} className="hidden" /></label>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['grid', 'carousel', 'list'].map(layout => (
                        <button key={layout} onClick={() => setConfig({ ...config, gallery_layout: layout })} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${config.gallery_layout === layout ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'}`}>
                          {layout === 'grid' ? 'Grade' : layout === 'carousel' ? 'Carrossel' : 'Lista'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.gallery_images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {config.gallery_images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border">
                          <img src={img} alt="" className="w-full h-24 object-cover" />
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openPhotoEditor(img, idx)} className="bg-white p-1.5 rounded-lg shadow hover:bg-gray-50"><Crop className="w-3 h-3" /></button>
                            <button onClick={() => removeGallery(idx)} className="bg-red-500 text-white p-1.5 rounded-lg shadow hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">Modelos:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {galleryTemplates.map(img => (
                      <button key={img.id} onClick={() => addGalleryImage(img.url)} className="rounded-lg overflow-hidden border hover:border-go-300 transition-all">
                        <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                        <p className="text-[10px] text-center text-gray-500 truncate">{img.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Avaliações</h2>
                    <label className="flex items-center gap-2 cursor-pointer"><span className="text-sm">Mostrar</span>
                      <button onClick={() => setConfig({ ...config, reviews_enabled: !config.reviews_enabled })} className={`w-10 h-6 rounded-full transition-colors ${config.reviews_enabled ? 'bg-go-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.reviews_enabled ? 'translate-x-5' : 'translate-x-1'}`} /></button>
                    </label>
                  </div>
                  {config.reviews_enabled && (
                    <>
                      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-medium">Adicionar Avaliação</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <input className="input-field text-sm" placeholder="Nome" value={newReview.name} onChange={e => setNewReview({ ...newReview, name: e.target.value })} />
                          <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => (<button key={s} onClick={() => setNewReview({ ...newReview, rating: s })} className={`p-1 ${s <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}><Star className="w-5 h-5 fill-current" /></button>))}</div>
                        </div>
                        <textarea className="input-field text-sm" placeholder="Comentário..." rows={2} value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
                        <button onClick={addReview} className="btn-primary !py-1.5 !px-3 text-sm"><Plus className="w-4 h-4 inline mr-1" /> Adicionar</button>
                      </div>
                      {config.reviews.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{r.name}</span>
                              <div className="flex">{Array.from({length: 5}).map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
                            </div>
                            <p className="text-sm text-gray-600">{r.comment}</p>
                          </div>
                          <button onClick={() => removeReview(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Photoshop tab */}
              {activeTab === 'photoshop' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Image className="w-5 h-5 text-go-500" /> Editor de Fotos Profissional</h2>
                  <p className="text-sm text-gray-500">Edite suas imagens com ferramentas profissionais e IA. Ajuste brilho, contraste, filtros, corte, remoção de fundo e muito mais.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {config.banner_url && (
                      <div className="relative group rounded-xl overflow-hidden border">
                        <img src={config.banner_url} alt="Banner" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => openPhotoEditor(config.banner_url)} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">Editar Banner</button>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Banner</div>
                      </div>
                    )}
                    {config.gallery_images?.slice(0, 3).map((img: string, idx: number) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border">
                        <img src={img} alt="" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => openPhotoEditor(img, idx)} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">Editar</button>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Galeria {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                  {!config.banner_url && config.gallery_images.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed">
                      <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Adicione um banner ou imagens na galeria primeiro</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-go-500/10 to-purple-500/10 rounded-xl p-4 border border-go-200">
                    <h3 className="text-sm font-semibold text-go-700 mb-2">Ferramentas disponíveis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">🎨 Ajustes (brilho, contraste, saturação)</div>
                      <div className="flex items-center gap-1">🌈 Filtros (vintage, cinema, HDR, etc.)</div>
                      <div className="flex items-center gap-1">✂️ Corte com proporções</div>
                      <div className="flex items-center gap-1">🔄 Rotação e espelhamento</div>
                      <div className="flex items-center gap-1">🤖 Ajuste Inteligente com IA</div>
                      <div className="flex items-center gap-1">🗑️ Remover fundo automaticamente</div>
                      <div className="flex items-center gap-1">💡 Sugestão de filtro por IA</div>
                      <div className="flex items-center gap-1">📝 Gerar prompt para DALL-E/Midjourney</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Cores do Tema</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: 'primary_color', label: 'Cor Primária' }, { key: 'secondary_color', label: 'Cor Secundária' }, { key: 'background_color', label: 'Fundo' }, { key: 'text_color', label: 'Texto' }, { key: 'button_color', label: 'Botão' }, { key: 'button_text_color', label: 'Texto Botão' }].map(({ key, label }) => (
                      <div key={key}><label className="text-sm text-gray-600 mb-1 block">{label}</label>
                        <div className="flex items-center gap-3"><input type="color" value={(config as any)[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border" /><span className="text-xs text-gray-500 font-mono">{(config as any)[key]}</span></div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Tema Pré-definido</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[{ id: 'default', label: 'Padrão', colors: ['#22c55e', '#6366f1', '#ffffff', '#111827'] }, { id: 'dark', label: 'Escuro', colors: ['#22c55e', '#818cf8', '#0f172a', '#f1f5f9'] }, { id: 'minimal', label: 'Minimal', colors: ['#000000', '#666666', '#ffffff', '#111827'] }, { id: 'custom', label: 'Custom', colors: [config.primary_color, config.secondary_color, config.background_color, config.text_color] }].map(t => (
                        <button key={t.id} onClick={() => setConfig({ ...config, theme: t.id })} className={`p-3 rounded-xl border text-center transition-all ${config.theme === t.id ? 'border-go-500 ring-2 ring-go-200' : 'border-gray-200'}`}>
                          <div className="flex gap-1 justify-center mb-2">{t.colors.map((c, i) => <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} />)}</div>
                          <span className="text-xs">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Avançado</h2>
                  <div className="lg:hidden border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-gray-900">White Label</p><p className="text-xs text-gray-500">Remover marca GoPay</p></div>
                      <button onClick={() => setConfig({ ...config, white_label: !config.white_label })} className={`w-10 h-6 rounded-full transition-colors ${config.white_label ? 'bg-go-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.white_label ? 'translate-x-5' : 'translate-x-1'}`} /></button>
                    </div>
                  </div>
                  <div><label className="text-sm text-gray-600 mb-1 block">CSS Personalizado</label><textarea className="input-field font-mono text-sm" rows={6} placeholder="/* Seu CSS aqui */" value={config.custom_css} onChange={e => setConfig({ ...config, custom_css: e.target.value })} /></div>
                  <div><label className="text-sm text-gray-600 mb-1 block">JavaScript Personalizado</label><textarea className="input-field font-mono text-sm" rows={6} placeholder="// Seu JS aqui" value={config.custom_js} onChange={e => setConfig({ ...config, custom_js: e.target.value })} /></div>
                  <div><label className="text-sm text-gray-600 mb-1 block">Link de Redirecionamento (pós-compra)</label><input className="input-field" placeholder="https://..." value={config.redirect_url} onChange={e => setConfig({ ...config, redirect_url: e.target.value })} /><p className="text-xs text-gray-400 mt-1">Cliente será redirecionado após pagamento confirmado</p></div>
                  <div><label className="text-sm text-gray-600 mb-1 block">Link de Afiliado / Produto</label><input className="input-field" placeholder="https://..." value={config.affiliate_link} onChange={e => setConfig({ ...config, affiliate_link: e.target.value })} /><p className="text-xs text-gray-400 mt-1">Link do produto afiliado (Hotmart, Monetizze, Eduzz, etc.)</p></div>
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Exportar Dados</h3>
                    <button onClick={() => { const data = JSON.stringify(config, null, 2); navigator.clipboard.writeText(data); toast.success('Config exportada!'); }} className="btn-secondary text-sm">Copiar Config</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview panel - Hotmart style */}
          <div className={`${preview ? 'flex' : 'hidden lg:flex'} flex-col w-full lg:w-[420px] bg-gray-100 rounded-2xl overflow-hidden ${previewDevice === 'mobile' ? 'max-w-[375px] mx-auto' : ''} ${preview ? 'flex-1 lg:flex-none' : ''}`}>
            <div className="bg-white px-4 py-2 border-b border-gray-100 text-center text-xs text-gray-400 flex-shrink-0">
              Prévia do Checkout {previewDevice === 'mobile' ? '(Mobile)' : '(Desktop)'}
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <div style={{ backgroundColor: config.background_color, color: config.text_color }}>
                {/* Full-width hero banner - bigger */}
                {config.banner_type === 'image' && config.banner_url && (
                  <div className="w-full relative">
                    <img src={config.banner_url} alt="Banner" className="w-full h-72 sm:h-96 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h1 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-lg">{selectedProductData?.name || 'Selecione um produto'}</h1>
                      <p className="text-white/80 text-sm drop-shadow">{selectedProductData?.description?.slice(0, 80) || ''}</p>
                    </div>
                  </div>
                )}
                {config.banner_type === 'color' && config.banner_color && (
                  <div className="w-full h-56 sm:h-72 flex items-end p-6" style={{ backgroundColor: config.banner_color }}>
                    <div>
                      <h1 className="text-white text-2xl sm:text-3xl font-bold">{selectedProductData?.name || 'Selecione um produto'}</h1>
                      <p className="text-white/80 text-sm">{selectedProductData?.description?.slice(0, 80) || ''}</p>
                    </div>
                  </div>
                )}
                {config.banner_type === 'gradient' && (
                  <div className="w-full h-56 sm:h-72 flex items-end p-6" style={{ background: `linear-gradient(135deg, ${config.banner_gradient_start || '#10b981'}, ${config.banner_gradient_end || '#6366f1'})` }}>
                    <div>
                      <h1 className="text-white text-2xl sm:text-3xl font-bold">{selectedProductData?.name || 'Selecione um produto'}</h1>
                      <p className="text-white/80 text-sm">{selectedProductData?.description?.slice(0, 80) || ''}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  {config.logo_url && (
                    <div className={`flex justify-${config.logo_position} mb-4`}>
                      <img src={config.logo_url} alt="Logo" className="max-h-10 object-contain" />
                    </div>
                  )}

                  {/* Product card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
                    <div className="p-5">
                      <p className="text-xs text-gray-500 mb-1">Autor: {selectedProductData?.name?.split(' ')[0] || 'Vendedor'}</p>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedProductData?.name || 'Nenhum produto selecionado'}</h2>
                      <p className="text-sm text-gray-500 mb-4">{selectedProductData?.description || 'Selecione um produto no menu acima para personalizar o checkout'}</p>
                      {selectedProductData && (
                        <>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs text-gray-400">12x de</span>
                            <span className="text-lg font-bold text-gray-400">R$ {(Number(selectedProductData.price) / 12).toFixed(2)}</span>
                          </div>
                          <div className="text-3xl font-extrabold mb-4" style={{ color: config.primary_color }}>R$ {Number(selectedProductData.price).toFixed(2)} à vista</div>
                        </>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Check className="w-3.5 h-3.5 text-go-500" /> Pagamento 100% seguro
                      </div>
                    </div>
                  </div>

                  {config.video_url && (
                    <div className="mb-5 aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                      <a href={config.video_url} target="_blank" className="flex items-center gap-2" style={{ color: config.primary_color }}><Play className="w-8 h-8" /> <span className="text-sm">Assistir Vídeo</span></a>
                    </div>
                  )}

                  {config.quiz_enabled && config.quiz_questions.length > 0 && (
                    <div className="mb-5 bg-white rounded-2xl border border-gray-100 p-4">
                      <h3 className="font-semibold mb-3" style={{ color: config.text_color }}>{config.quiz_title || 'Quiz'}</h3>
                      {config.quiz_questions.slice(0, 1).map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <p className="text-sm font-medium">{q.question}</p>
                          {q.options.map((opt: string, oi: number) => (
                            <label key={oi} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-go-200 cursor-pointer transition-all">
                              <input type="radio" name={`quiz-${idx}`} className="text-go-500" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {config.gallery_images.length > 0 && (
                    <div className={`mb-5 grid ${config.gallery_layout === 'grid' ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-2'}`}>
                      {config.gallery_images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden"><img src={img} alt="" className="w-full h-28 object-cover" /></div>
                      ))}
                    </div>
                  )}

                  {/* Customer form section */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Dados pessoais
                    </h3>
                    <input className="input-field text-sm" placeholder="Nome completo" disabled />
                    <input className="input-field text-sm" placeholder="Email" disabled />
                    <input className="input-field text-sm" placeholder="Telefone" disabled />
                    <input className="input-field text-sm" placeholder="CPF" disabled />
                  </div>

                  {/* Pix payment section */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" style={{ color: config.primary_color }} /> Pagamento
                    </h3>
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pix</p>
                          <p className="text-xs text-gray-500">Pagamento instantâneo</p>
                        </div>
                        <div className="ml-auto w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                      </div>
                    </div>
                    <button style={{ backgroundColor: config.button_color, color: config.button_text_color }}
                      className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      Comprar agora
                    </button>
                  </div>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-5">
                    <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Pagamento seguro</div>
                    <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-go-500" /> Dados protegidos</div>
                  </div>

                  {config.reviews_enabled && config.reviews.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400 fill-current" /> Avaliações ({config.reviews.length})</h3>
                      {config.reviews.slice(0, 3).map((r: any, idx: number) => (
                        <div key={idx} className="border-b border-gray-50 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-go-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{r.name.charAt(0).toUpperCase()}</div>
                            <div><span className="text-sm font-medium">{r.name}</span>
                              <div className="flex">{Array.from({length: 5}).map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-10">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!config.white_label && !config.logo_url && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        GoPay - Pagamento processado com segurança
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {photoEditor.open && (
        <PhotoEditorPro
          imageUrl={photoEditor.url}
          onSave={saveEditedPhoto}
          onClose={() => setPhotoEditor({ open: false, url: '' })}
        />
      )}
      <AIChat context="editor" />
    </div>
  );
}

