import { useState } from 'react';
import { TrendingUp, Sparkles, Loader2, Search, ShoppingBag, Tag, DollarSign, Users, Globe, Copy, ExternalLink, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getJuliaReply } from '../../services/groqService';

const CATEGORIES = [
  'Saúde & Bem-estar', 'Fitness', 'Beleza & Estética', 'Moda', 'Tecnologia',
  'Casa & Decoração', 'Pet Shop', 'Infantil', 'Cursos Online', 'Eletrônicos',
  'Alimentação', 'Automotivo', 'Marketing Digital', 'Financeiro',
];

const SYSTEM_PROMPT = `Você é um especialista em marketing digital e pesquisa de produtos virais.
Com base na categoria solicitada, retorne UM JSON válido com 3 produtos virais/trending.
Cada produto deve ter:
{
  "products": [
    {
      "name": "Nome do Produto",
      "description": "Descrição curta e persuasiva (máx 100 caracteres)",
      "niche": "Nicho específico",
      "estimatedPrice": "faixa de preço sugerida ex: R$ 47-97",
      "viralReason": "Por que está viralizando (máx 60 caracteres)",
      "trendScore": 1-100,
      "keywords": ["palavra1", "palavra2", "palavra3"],
      "platforms": ["TikTok", "Instagram", "YouTube"]
    }
  ]
}
Retorne APENAS o JSON, sem explicações.`;

export default function ViralProducts() {
  const [category, setCategory] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  const searchViral = async () => {
    const niche = customNiche || category;
    if (!niche) return toast.error('Selecione ou digite um nicho');
    setLoading(true);
    setProducts([]);
    setAiDescription('');
    try {
      const reply = await getJuliaReply(
        [{ role: 'user', content: `Busque produtos virais/trending no nicho: ${niche}. Considere tendências atuais do TikTok, Instagram e mercado brasileiro.` }],
        SYSTEM_PROMPT
      );
      const cleaned = reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.products) {
        setProducts(parsed.products);
        setAiDescription(`Produtos virais encontrados para "${niche}" com análise de tendências`);
      } else {
        toast.error('Resposta inválida da IA');
      }
    } catch {
      // Fallback with realistic products
      const fallback = [
        { name: `Kit Digital ${category || customNiche || 'Emagrecimento'}`, description: 'Guia completo com rotinas, receitas e acompanhamento', niche: niche, estimatedPrice: 'R$ 27-67', viralReason: 'Alta demanda em redes sociais', trendScore: 92, keywords: [niche, 'digital', 'kit'], platforms: ['TikTok', 'Instagram'] },
        { name: `Mentoria ${category || customNiche || 'Marketing'} Online`, description: 'Aprenda do zero com especialistas do mercado', niche: niche, estimatedPrice: 'R$ 97-197', viralReason: 'Trend de educação online', trendScore: 85, keywords: [niche, 'mentoria', 'online'], platforms: ['YouTube', 'Instagram'] },
        { name: `Produto Físico ${category || customNiche || 'Bem-estar'} Pro`, description: 'Produto inovador com alta margem e recompra', niche: niche, estimatedPrice: 'R$ 49-129', viralReason: 'Alta procura em marketplaces', trendScore: 78, keywords: [niche, 'produto', 'inovador'], platforms: ['TikTok', 'Shopee'] },
      ];
      setProducts(fallback);
      setAiDescription(`Tendências simuladas para "${niche}" (IA indisponível, exibindo dados genéricos)`);
    }
    setLoading(false);
  };

  const copyProduct = (p: any) => {
    const text = `Produto: ${p.name}\nDescrição: ${p.description}\nPreço: ${p.estimatedPrice}\nNicho: ${p.niche}\nPor que viral: ${p.viralReason}`;
    navigator.clipboard.writeText(text);
    toast.success('Produto copiado!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-go-500" />Produtos Virais</h1>
          <p className="text-gray-500 mt-1">Descubra produtos trending com IA para vender agora</p>
        </div>
      </div>

      {/* Search */}
      <div className="card !p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.slice(0, 8).map(c => (
            <button key={c} onClick={() => { setCategory(c); setCustomNiche(''); }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? 'bg-go-500 text-white shadow-lg shadow-go-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.slice(8).map(c => (
            <button key={c} onClick={() => { setCategory(c); setCustomNiche(''); }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? 'bg-go-500 text-white shadow-lg shadow-go-500/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customNiche} onChange={e => { setCustomNiche(e.target.value); setCategory(''); }} className="input-field flex-1" placeholder="Ou digite um nicho personalizado (ex: Jardinagem, Games, Música)" onKeyDown={e => e.key === 'Enter' && searchViral()} />
          <button onClick={searchViral} disabled={loading || (!category && !customNiche)} className="btn-primary flex items-center gap-2 !px-6">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Buscar
          </button>
        </div>
      </div>

      {/* AI Analysis */}
      {aiDescription && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <p className="text-sm text-gray-700">{aiDescription}</p>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-go-500 mb-4" />
          <p className="text-sm text-gray-400">IA analisando tendências do mercado...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-4">
          {products.map((p, idx) => (
            <div key={idx} className="card !p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`w-4 h-4 ${idx === 0 ? 'text-red-500' : idx === 1 ? 'text-orange-500' : 'text-go-500'}`} />
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    {idx === 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">🔥 Top 1</span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg"><Tag className="w-3 h-3" /> {p.niche}</span>
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg"><DollarSign className="w-3 h-3" /> {p.estimatedPrice}</span>
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg"><BarChart3 className="w-3 h-3" /> Score: {p.trendScore}/100</span>
                    <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg"><Users className="w-3 h-3" /> {p.platforms?.join(', ')}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {p.viralReason}</p>
                  {p.keywords && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.keywords.map((kw: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border">#{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => copyProduct(p)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="Copiar">
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Selecione um nicho e clique em Buscar para descobrir produtos virais</p>
        </div>
      )}

      {/* Info */}
      <div className="card !p-6 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Globe className="w-5 h-5 text-gray-400" /> Dicas para produtos virais</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-3 bg-gray-50 rounded-xl"><strong className="text-gray-900">Tendências TikTok</strong><p className="text-xs mt-1">Produtos com alto engajamento no TikTok têm potencial viral. Busque por hashtags em alta.</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><strong className="text-gray-900">Baixo ticket + Alta margem</strong><p className="text-xs mt-1">Produtos digitais de R$ 27-97 têm menor resistência de compra e margens maiores.</p></div>
          <div className="p-3 bg-gray-50 rounded-xl"><strong className="text-gray-900">Sazonalidade</strong><p className="text-xs mt-1">Aproveite datas comemorativas e eventos sazonais para lançar produtos temáticos.</p></div>
        </div>
      </div>
    </div>
  );
}