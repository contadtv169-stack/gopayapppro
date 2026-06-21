import { useState } from 'react';
import { Facebook, Image, Video, Send, Loader2, Globe, Target, DollarSign, Check, AlertCircle, TrendingUp, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getJuliaReply } from '../../services/groqService';

const ADS_SYSTEM_PROMPT = `Você é um especialista em Facebook Ads e Marketing Digital.
Gere criativos de anúncio persuasivos em português do Brasil baseados no produto informado.
Retorne APENAS um JSON válido neste formato:
{
  "headline": "Título principal do anúncio (máx 40 caracteres)",
  "primaryText": "Texto principal do anúncio (máx 125 caracteres)",
  "description": "Descrição curta (máx 30 caracteres)",
  "callToAction": "Comprar agora | Saiba mais | Inscreva-se | Falar conosco",
  "targeting": "Público alvo sugerido",
  "budgetSuggestion": "Valor sugerido de investimento diário"
}`;

export default function FacebookAds() {
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState<'config' | 'create' | 'publish'>('config');
  const [productInfo, setProductInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [dailyBudget, setDailyBudget] = useState(20);
  const [adLink, setAdLink] = useState('');
  const [linkType, setLinkType] = useState<'whatsapp' | 'landing'>('landing');
  const [publishing, setPublishing] = useState(false);
  const [pageId, setPageId] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const generateAd = async () => {
    if (!productInfo.trim()) return toast.error('Descreva o produto primeiro');
    setGenerating(true);
    try {
      const reply = await getJuliaReply(
        [{ role: 'user', content: `Produto: ${productInfo}\nImagem: ${imageUrl || 'N/A'}\nVídeo: ${videoUrl || 'N/A'}` }],
        ADS_SYSTEM_PROMPT
      );
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());
      setGenerated(parsed);
      toast.success('Anúncio gerado com IA!');
    } catch {
      setGenerated({
        headline: productInfo.slice(0, 40),
        primaryText: `Aproveite ${productInfo.slice(0, 80)} com oferta especial!`,
        description: 'Oferta por tempo limitado',
        callToAction: 'Comprar agora',
        targeting: 'Brasil, 18-65 anos, interessados em ' + productInfo.split(' ').slice(0, 3).join(' '),
        budgetSuggestion: 'R$ 20-50/dia',
      });
      toast.success('Anúncio gerado!');
    }
    setGenerating(false);
  };

  const connectFacebook = () => {
    toast('Conecte sua conta do Facebook para publicar anúncios.', { icon: 'ℹ️' });
    setConnected(false);
  };

  const publishAd = async () => {
    if (!accessToken || !adAccountId) {
      toast.error('Conecte sua conta do Facebook primeiro');
      return;
    }
    setPublishing(true);
    try {
      if (!generated) throw new Error('Gere um anúncio primeiro');
      const creativeBody = {
        object_story_spec: {
          page_id: pageId,
          link_data: {
            link: adLink || 'https://gopayapppro.com',
            message: generated.primaryText,
            name: generated.headline,
            description: generated.description,
            call_to_action: { type: generated.callToAction?.toUpperCase().replace(/\s/g, '_') || 'LEARN_MORE' },
          },
        },
      };
      const fbRes = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          name: `GoPay Ad - ${generated.headline.slice(0, 30)}`,
          adset_id: adAccountId,
          creative: creativeBody,
          status: 'PAUSED',
        }),
      });
      if (!fbRes.ok) throw new Error('Facebook API error');
      toast.success('Anúncio criado e pausado! Ative no Facebook Ads Manager.');
    } catch (err: any) {
      toast.error(err.message === 'Facebook API error' ? 'Erro ao conectar com Facebook. Verifique suas credenciais.' : err.message || 'Erro ao publicar');
    }
    setPublishing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facebook Ads</h1>
          <p className="text-gray-500 mt-1">Crie e publique anúncios com IA</p>
        </div>
        {connected && <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"><Check className="w-4 h-4" /> Conectado</span>}
      </div>

      {/* Connection */}
      <div className="card !p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Facebook className="w-5 h-5 text-blue-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Conexão Facebook</h2><p className="text-sm text-gray-500">Conecte sua conta de anúncios</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label><input value={accessToken} onChange={e => setAccessToken(e.target.value)} className="input-field" type="password" placeholder="Token do Facebook" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Ad Account ID</label><input value={adAccountId} onChange={e => setAdAccountId(e.target.value)} className="input-field" placeholder="Ex: 123456789" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Page ID</label><input value={pageId} onChange={e => setPageId(e.target.value)} className="input-field" placeholder="ID da sua página" /></div>
        </div>
        <button onClick={connectFacebook} className="btn-primary flex items-center gap-2 mt-4">
          <Facebook className="w-4 h-4" /> {connected ? 'Reconectar' : 'Conectar'}
        </button>
        <p className="text-xs text-gray-400 mt-2">Você precisa de um Access Token do Facebook com permissões ads_management e pages_read_engagement.</p>
      </div>

      {/* Create Ad */}
      <div className="card !p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-purple-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Criar Anúncio com IA</h2><p className="text-sm text-gray-500">Julia gera o criativo automaticamente</p></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descreva seu produto</label>
          <textarea value={productInfo} onChange={e => setProductInfo(e.target.value)} className="input-field h-20" placeholder="Ex: Curso online de marketing digital para iniciantes com certificado..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label><input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label><input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="input-field" placeholder="https://..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link do Anúncio</label>
            <input value={adLink} onChange={e => setAdLink(e.target.value)} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Link</label>
            <div className="flex gap-2">
              <button onClick={() => setLinkType('whatsapp')} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${linkType === 'whatsapp' ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'}`}>WhatsApp</button>
              <button onClick={() => setLinkType('landing')} className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${linkType === 'landing' ? 'border-go-500 bg-go-50 text-go-700' : 'border-gray-200 text-gray-600'}`}>Landing Page</button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Diário (R$)</label>
          <div className="flex items-center gap-3">
            <input type="range" min="5" max="500" value={dailyBudget} onChange={e => setDailyBudget(Number(e.target.value))} className="flex-1" />
            <span className="text-lg font-bold text-go-600 w-16 text-right">R$ {dailyBudget}</span>
          </div>
        </div>
        <button onClick={generateAd} disabled={generating || !productInfo} className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
          {generating ? 'Gerando anúncio...' : 'Gerar Anúncio com IA'}
        </button>

        {generated && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100 space-y-3">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-purple-900">Anúncio Gerado</h3></div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-sm font-bold text-gray-900">{generated.headline}</p>
              <p className="text-sm text-gray-600 mt-1">{generated.primaryText}</p>
              <p className="text-xs text-gray-400 mt-1">{generated.description}</p>
              <div className="flex items-center gap-2 mt-3"><span className="text-xs bg-go-100 text-go-700 px-2 py-1 rounded-full">{generated.callToAction}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{generated.targeting?.slice(0, 60)}</span></div>
              <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{generated.budgetSuggestion}</span></div>
            </div>
            <button onClick={publishAd} disabled={publishing} className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
              {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {publishing ? 'Publicando...' : 'Publicar no Facebook'}
            </button>
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="card !p-6">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-gray-400" /> Como Configurar</h2>
        <ol className="space-y-2 text-sm text-gray-600">
          <li>1. Crie uma conta no <a href="https://developers.facebook.com" target="_blank" className="text-go-600 hover:underline">Facebook Developers</a></li>
          <li>2. Crie um App e adicione o produto "Marketing API"</li>
          <li>3. Gere um Access Token com permissões: ads_management, pages_read_engagement</li>
          <li>4. Copie seu Ad Account ID (act_XXXXXX) e Page ID</li>
          <li>5. Cole os dados acima e crie anúncios com IA!</li>
        </ol>
      </div>
    </div>
  );
}