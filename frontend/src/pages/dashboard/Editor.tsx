import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Palette, Image, Type, Video, Layout, Star, HelpCircle, 
  Eye, EyeOff, Save, Upload, Plus, Trash2, GripVertical,
  ChevronDown, ChevronUp, Monitor, Smartphone, 
  X, Check, Move, Play, Link, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AIChat } from '../../components/AIChat';
import api from '../../services/api';

type Tab = 'banner' | 'logo' | 'video' | 'quiz' | 'gallery' | 'reviews' | 'colors' | 'advanced';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'banner', label: 'Banner', icon: Image },
  { id: 'logo', label: 'Logo', icon: Type },
  { id: 'video', label: 'Vídeo', icon: Video },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'gallery', label: 'Galeria', icon: Layout },
  { id: 'reviews', label: 'Avaliações', icon: Star },
  { id: 'colors', label: 'Cores', icon: Palette },
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
    mode: 'real',
    white_label: false,
    hide_gopay_branding: false,
    logo_url: '',
    logo_position: 'center',
    banner_url: '',
    banner_type: 'image',
    banner_color: '#22c55e',
    banner_gradient_start: '#22c55e',
    banner_gradient_end: '#6366f1',
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

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'all') {
      api.get(`/customizations/checkout/${selectedProduct}`).then(({ data }) => {
        if (data && data.id) setConfig(prev => ({ ...prev, ...data }));
      }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [selectedProduct]);

  const save = async () => {
    if (selectedProduct === 'all') return toast.error('Selecione um produto para personalizar');
    setSaving(true);
    try {
      await api.put(`/customizations/checkout/${selectedProduct}`, config);
      toast.success('Personalização salva!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const addGalleryImage = () => {
    if (newGalleryUrl) {
      setConfig({ ...config, gallery_images: [...config.gallery_images, newGalleryUrl] });
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Editor de Checkout</h1>
          {/* Demo/Real Toggle */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
            config.mode === 'demo' ? 'bg-yellow-50 border border-yellow-200' : 'bg-go-50 border border-go-200'
          }`}>
            <span className="text-xs font-medium">{config.mode === 'demo' ? '🧪 Modo Demonstração' : '✅ Modo Produção'}</span>
            <button onClick={() => setConfig({ ...config, mode: config.mode === 'demo' ? 'real' : 'demo' })}
              className={`w-10 h-5 rounded-full transition-colors ${config.mode === 'real' ? 'bg-go-500' : 'bg-yellow-400'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.mode === 'real' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            {config.mode === 'demo' && <span className="text-[10px] text-yellow-700">Dados não serão salvos</span>}
          </div>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="input-field !py-1.5 !px-3 text-sm max-w-[250px]">
            <option value="all">Selecione um produto...</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-md ${previewDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}><Monitor className="w-4 h-4" /></button>
            <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-md ${previewDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}><Smartphone className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setPreview(!preview)} className={`btn-secondary !py-2 !px-4 text-sm flex items-center gap-2 ${preview ? 'bg-go-50 text-go-700 border-go-200' : ''}`}>
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {preview ? 'Editar' : 'Prévia'}
          </button>
          <button onClick={save} disabled={saving || selectedProduct === 'all'} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Sidebar - Tabs */}
        <div className="w-56 flex-shrink-0 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-go-50 text-go-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
          {/* White Label Toggle */}
          <div className="border-t border-gray-100 pt-4 mt-4">
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

        {/* Main Editor Area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Editor Panel */}
          <div className={`${preview ? 'hidden' : 'flex'} flex-col flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden`}>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Banner Tab */}
              {activeTab === 'banner' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Banner</h2>
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
                      <label className="text-sm text-gray-600 mb-1 block">URL da Imagem do Banner</label>
                      <div className="flex gap-2">
                        <input className="input-field flex-1" placeholder="https://..." value={config.banner_url} onChange={e => setConfig({ ...config, banner_url: e.target.value })} />
                        <button className="btn-secondary !py-2 !px-3"><Upload className="w-4 h-4" /></button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Ou escolha da galeria:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                        {galleryTemplates.map(img => (
                          <button key={img.id} onClick={() => setConfig({ ...config, banner_url: img.url })}
                            className={`relative rounded-lg overflow-hidden border-2 ${config.banner_url === img.url ? 'border-go-500' : 'border-transparent'} hover:border-go-300 transition-all`}>
                            <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                            <p className="text-[10px] text-center text-gray-500 truncate">{img.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {config.banner_type === 'color' && (
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={config.banner_color} onChange={e => setConfig({ ...config, banner_color: e.target.value })}
                          className="w-12 h-12 rounded-xl cursor-pointer border" />
                        <span className="text-sm text-gray-500">{config.banner_color}</span>
                      </div>
                    </div>
                  )}
                  {config.banner_type === 'gradient' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Cor Inicial</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={config.banner_gradient_start} onChange={e => setConfig({ ...config, banner_gradient_start: e.target.value })}
                            className="w-12 h-12 rounded-xl cursor-pointer border" />
                          <span className="text-sm text-gray-500">{config.banner_gradient_start}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Cor Final</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={config.banner_gradient_end} onChange={e => setConfig({ ...config, banner_gradient_end: e.target.value })}
                            className="w-12 h-12 rounded-xl cursor-pointer border" />
                          <span className="text-sm text-gray-500">{config.banner_gradient_end}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Logo</h2>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">URL da Logo</label>
                    <input className="input-field" placeholder="https://..." value={config.logo_url} onChange={e => setConfig({ ...config, logo_url: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Posição da Logo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['left', 'center', 'right'].map(pos => (
                        <button key={pos} onClick={() => setConfig({ ...config, logo_position: pos })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            config.logo_position === pos ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'
                          }`}>
                          {pos === 'left' ? 'Esquerda' : pos === 'center' ? 'Centro' : 'Direita'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.logo_url && (
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <p className="text-xs text-gray-400 mb-2">Prévia:</p>
                      <img src={config.logo_url} alt="Logo" className="max-h-16 object-contain mx-auto" />
                    </div>
                  )}
                </div>
              )}

              {/* Video Tab */}
              {activeTab === 'video' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Vídeo</h2>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">URL do Vídeo (YouTube/Vimeo)</label>
                    <input className="input-field" placeholder="https://youtube.com/watch?v=..." value={config.video_url} onChange={e => setConfig({ ...config, video_url: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.video_autoplay} onChange={e => setConfig({ ...config, video_autoplay: e.target.checked })}
                        className="w-4 h-4 text-go-500 rounded" />
                      <span className="text-sm">Autoplay</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.video_loop} onChange={e => setConfig({ ...config, video_loop: e.target.checked })}
                        className="w-4 h-4 text-go-500 rounded" />
                      <span className="text-sm">Loop</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Quiz</h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm">Ativar Quiz</span>
                      <button onClick={() => setConfig({ ...config, quiz_enabled: !config.quiz_enabled })}
                        className={`w-10 h-6 rounded-full transition-colors ${config.quiz_enabled ? 'bg-go-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.quiz_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </label>
                  </div>
                  {config.quiz_enabled && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Título do Quiz</label>
                        <input className="input-field" value={config.quiz_title} onChange={e => setConfig({ ...config, quiz_title: e.target.value })} />
                      </div>
                      {config.quiz_questions.map((q: any, idx: number) => (
                        <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">Pergunta {idx + 1}</span>
                            <button onClick={() => setConfig({ ...config, quiz_questions: config.quiz_questions.filter((_: any, i: number) => i !== idx) })}
                              className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <input className="input-field mb-3" value={q.question} onChange={e => {
                            const qs = [...config.quiz_questions];
                            qs[idx] = { ...qs[idx], question: e.target.value };
                            setConfig({ ...config, quiz_questions: qs });
                          }} placeholder="Digite a pergunta" />
                          <div className="space-y-2">
                            {q.options.map((opt: string, oi: number) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input className="input-field flex-1 text-sm" value={opt} onChange={e => {
                                  const qs = [...config.quiz_questions];
                                  qs[idx].options[oi] = e.target.value;
                                  setConfig({ ...config, quiz_questions: qs });
                                }} />
                                <button onClick={() => {
                                  const qs = [...config.quiz_questions];
                                  qs[idx].options.splice(oi, 1);
                                  setConfig({ ...config, quiz_questions: qs });
                                }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                            <button onClick={() => {
                              const qs = [...config.quiz_questions];
                              qs[idx].options.push('');
                              setConfig({ ...config, quiz_questions: qs });
                            }} className="text-sm text-go-600 hover:text-go-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar opção</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setConfig({ ...config, quiz_questions: [...config.quiz_questions, { id: String(Date.now()), question: '', options: ['', ''], type: 'single' }] })}
                        className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar Pergunta</button>
                    </>
                  )}
                </div>
              )}

              {/* Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Galeria de Imagens</h2>
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="URL da imagem" value={newGalleryUrl} onChange={e => setNewGalleryUrl(e.target.value)} />
                    <button onClick={addGalleryImage} className="btn-primary !py-2 !px-4 text-sm"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Layout da Galeria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['grid', 'carousel', 'list'].map(layout => (
                        <button key={layout} onClick={() => setConfig({ ...config, gallery_layout: layout })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            config.gallery_layout === layout ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'
                          }`}>
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
                          <button onClick={() => removeGallery(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">Ou escolha imagens da galeria:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {galleryTemplates.map(img => (
                      <button key={img.id} onClick={() => {
                        setConfig({ ...config, gallery_images: [...config.gallery_images, img.url] });
                      }} className="rounded-lg overflow-hidden border hover:border-go-300 transition-all">
                        <img src={img.url} alt={img.label} className="w-full h-16 object-cover" />
                        <p className="text-[10px] text-center text-gray-500 truncate">{img.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Avaliações</h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm">Mostrar Avaliações</span>
                      <button onClick={() => setConfig({ ...config, reviews_enabled: !config.reviews_enabled })}
                        className={`w-10 h-6 rounded-full transition-colors ${config.reviews_enabled ? 'bg-go-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.reviews_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </label>
                  </div>
                  {config.reviews_enabled && (
                    <>
                      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-medium">Adicionar Avaliação</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <input className="input-field text-sm" placeholder="Nome do cliente" value={newReview.name}
                            onChange={e => setNewReview({ ...newReview, name: e.target.value })} />
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setNewReview({ ...newReview, rating: s })}
                                className={`p-1 ${s <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                <Star className="w-5 h-5 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea className="input-field text-sm" placeholder="Comentário..." rows={2} value={newReview.comment}
                          onChange={e => setNewReview({ ...newReview, comment: e.target.value })} />
                        <button onClick={addReview} className="btn-primary !py-1.5 !px-3 text-sm"><Plus className="w-4 h-4 inline mr-1" /> Adicionar</button>
                      </div>
                      {config.reviews.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{r.name}</span>
                              <div className="flex">{Array.from({length: 5}).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                              ))}</div>
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

              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Cores do Tema</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'primary_color', label: 'Cor Primária' },
                      { key: 'secondary_color', label: 'Cor Secundária' },
                      { key: 'background_color', label: 'Fundo' },
                      { key: 'text_color', label: 'Texto' },
                      { key: 'button_color', label: 'Botão' },
                      { key: 'button_text_color', label: 'Texto do Botão' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={(config as any)[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border" />
                          <span className="text-xs text-gray-500 font-mono">{(config as any)[key]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Tema Pré-definido</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'default', label: 'Padrão', colors: ['#22c55e', '#6366f1', '#ffffff', '#111827'] },
                        { id: 'dark', label: 'Escuro', colors: ['#22c55e', '#818cf8', '#0f172a', '#f1f5f9'] },
                        { id: 'minimal', label: 'Minimal', colors: ['#000000', '#666666', '#ffffff', '#111827'] },
                        { id: 'custom', label: 'Customizado', colors: [config.primary_color, config.secondary_color, config.background_color, config.text_color] },
                      ].map(t => (
                        <button key={t.id} onClick={() => setConfig({ ...config, theme: t.id })}
                          className={`p-3 rounded-xl border text-center transition-all ${config.theme === t.id ? 'border-go-500 ring-2 ring-go-200' : 'border-gray-200'}`}>
                          <div className="flex gap-1 justify-center mb-2">
                            {t.colors.map((c, i) => <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c }} />)}
                          </div>
                          <span className="text-xs">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Avançado</h2>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">CSS Personalizado</label>
                    <textarea className="input-field font-mono text-sm" rows={6} placeholder="/* Seu CSS aqui */" value={config.custom_css}
                      onChange={e => setConfig({ ...config, custom_css: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">JavaScript Personalizado</label>
                    <textarea className="input-field font-mono text-sm" rows={6} placeholder="// Seu JS aqui" value={config.custom_js}
                      onChange={e => setConfig({ ...config, custom_js: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className={`${preview ? 'flex' : 'hidden lg:flex'} flex-col w-full lg:w-[420px] bg-gray-100 rounded-2xl overflow-hidden ${previewDevice === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
            <div className="bg-white px-4 py-2 border-b border-gray-100 text-center text-xs text-gray-400 flex-shrink-0">
              {preview ? 'Prévia do Checkout' : 'Prévia'} {previewDevice === 'mobile' ? '(Mobile)' : '(Desktop)'}
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Preview Content */}
              <div style={{ backgroundColor: config.background_color, color: config.text_color }}>
                {/* Banner */}
                {config.banner_type === 'image' && config.banner_url && (
                  <img src={config.banner_url} alt="Banner" className="w-full h-40 object-cover" />
                )}
                {config.banner_type === 'color' && config.banner_color && (
                  <div className="w-full h-32" style={{ backgroundColor: config.banner_color }} />
                )}
                {config.banner_type === 'gradient' && (
                  <div className="w-full h-32" style={{ background: `linear-gradient(135deg, ${config.banner_gradient_start}, ${config.banner_gradient_end})` }} />
                )}

                <div className="p-6">
                  {/* Logo */}
                  {config.logo_url && (
                    <div className={`flex justify-${config.logo_position} mb-6`}>
                      <img src={config.logo_url} alt="Logo" className="max-h-12 object-contain" />
                    </div>
                  )}

                  {/* White Label / Branding */}
                  {!config.hide_gopay_branding && !config.white_label && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-gray-400">Powered by GoPay</span>
                    </div>
                  )}

                  {/* Video */}
                  {config.video_url && (
                    <div className="mb-6 aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                      <a href={config.video_url} target="_blank" className="flex items-center gap-2 text-go-600">
                        <Play className="w-8 h-8" /> <span className="text-sm">Assistir Vídeo</span>
                      </a>
                    </div>
                  )}

                  {/* Quiz */}
                  {config.quiz_enabled && config.quiz_questions.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold mb-3">{config.quiz_title}</h3>
                      {config.quiz_questions.slice(0, 1).map((q: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <p className="text-sm font-medium">{q.question}</p>
                          {q.options.map((opt: string, oi: number) => (
                            <label key={oi} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-go-200 cursor-pointer">
                              <input type="radio" name={`quiz-${idx}`} className="text-go-500" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gallery */}
                  {config.gallery_images.length > 0 && (
                    <div className={`mb-6 grid ${config.gallery_layout === 'grid' ? 'grid-cols-2 gap-2' : config.gallery_layout === 'carousel' ? 'grid-cols-1 gap-2' : 'grid-cols-1 gap-2'}`}>
                      {config.gallery_images.slice(0, 4).map((img, idx) => (
                        <img key={idx} src={img} alt="" className="rounded-xl w-full h-24 object-cover" />
                      ))}
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold" style={{ color: config.text_color }}>Nome do Produto</h1>
                    <p className="text-sm mt-2" style={{ color: config.text_color + 'cc' }}>Descrição do produto aparecerá aqui</p>
                    <div className="text-3xl font-extrabold mt-4" style={{ color: config.primary_color }}>R$ 97,00</div>
                  </div>

                  {/* Button */}
                  <button style={{ backgroundColor: config.button_color, color: config.button_text_color }}
                    className="w-full py-4 rounded-xl font-bold text-lg shadow-lg mb-4">
                    Comprar Agora
                  </button>

                  {/* Reviews */}
                  {config.reviews_enabled && config.reviews.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" /> Avaliações ({config.reviews.length})
                      </h3>
                      {config.reviews.slice(0, 3).map((r: any, idx: number) => (
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

                  {/* Footer */}
                  {!config.white_label && (
                    <div className="text-center mt-6 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400">GoPay - Pagamento processado com segurança</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AIChat context="editor" />
    </div>
  );
}
