import { useState, useEffect } from 'react';
import { MessageCircle, Phone, Settings, Power, ExternalLink, Save, RefreshCw, Bot, ShoppingCart, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { getJuliaReply, WHATSAPP_SYSTEM_PROMPT } from '../../services/groqService';

export default function WhatsApp() {
  const [config, setConfig] = useState({ instanceId: '', token: '', enabled: false, autoReply: true, notifySales: true, welcomeMessage: 'Ola! Bem-vindo(a) a {loja}! Como posso ajudar?', juliaPrompt: '' });
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingJulia, setTestingJulia] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [juliaReply, setJuliaReply] = useState('');

  useEffect(() => {
    (async () => {
      const uid = JSON.parse(localStorage.getItem('gopay_user') || '{}').id;
      if (!uid) { setLoading(false); return; }
      const { data } = await supabase.from('whatsapp_config').select('*').eq('user_id', uid).single();
      if (data) setConfig({
        instanceId: data.instance_id || '',
        token: data.api_token || '',
        enabled: data.enabled || false,
        autoReply: data.auto_reply !== false,
        notifySales: data.notify_sales !== false,
        welcomeMessage: data.welcome_message || '',
        juliaPrompt: data.julia_prompt || '',
      });
      setLoading(false);
    })();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    const uid = JSON.parse(localStorage.getItem('gopay_user') || '{}').id;
    if (!uid) { toast.error('Faça login novamente'); setSaving(false); return; }
    await supabase.from('whatsapp_config').upsert({
      user_id: uid,
      instance_id: config.instanceId,
      api_token: config.token,
      enabled: config.enabled,
      auto_reply: config.autoReply,
      notify_sales: config.notifySales,
      welcome_message: config.welcomeMessage,
      julia_prompt: config.juliaPrompt,
    });
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const testConnection = async () => {
    if (!config.instanceId || !config.token) { toast.error('Preencha Instance ID e Token primeiro'); return; }
    setConnecting(true);
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${config.instanceId}/getStateInstance/${config.token}`);
      const data = await res.json();
      if (data.stateInstance === 'notAuthorized') toast.error('WhatsApp não autorizado. Escaneie o QR Code.');
      else if (data.stateInstance === 'authorized') toast.success('Conexão OK! WhatsApp autorizado.');
      else toast('Status: ' + (data.stateInstance || 'desconhecido'));
    } catch {
      toast.error('Erro ao conectar. Verifique Instance ID e Token.');
    }
    setConnecting(false);
  };

  const testJuliaReply = async () => {
    if (!testMsg.trim()) return toast.error('Digite uma mensagem para testar');
    setTestingJulia(true);
    setJuliaReply('');
    try {
      const reply = await getJuliaReply(
        [{ role: 'user', content: testMsg }],
        config.juliaPrompt || WHATSAPP_SYSTEM_PROMPT
      );
      setJuliaReply(reply);
    } catch {
      toast.error('Erro ao testar Julia');
    }
    setTestingJulia(false);
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-500 mt-1">Vendas automatizadas com Julia IA via Green API</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-500">{config.enabled ? 'Ativo' : 'Inativo'}</span>
          <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`w-12 h-7 rounded-full transition-colors ${config.enabled ? 'bg-go-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {/* Green API Connection */}
      <div className="card !p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Green API</h2><p className="text-sm text-gray-500">Conecte seu WhatsApp</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label><input value={config.instanceId} onChange={e => setConfig({ ...config, instanceId: e.target.value })} className="input-field" placeholder="Ex: 1234567890" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">API Token</label><input value={config.token} onChange={e => setConfig({ ...config, token: e.target.value })} className="input-field" type="password" placeholder="Seu token Green API" /></div>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button onClick={testConnection} disabled={connecting} className="btn-secondary flex items-center gap-2">{connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}{connecting ? 'Testando...' : 'Testar Conexão'}</button>
          <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-2">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>

      {/* Julia AI - Auto Reply */}
      <div className="card !p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Bot className="w-5 h-5 text-purple-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Julia IA - Suporte Automático</h2><p className="text-sm text-gray-500">IA responde clientes no WhatsApp</p></div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.autoReply} onChange={e => setConfig({ ...config, autoReply: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-go-600 focus:ring-go-500" />
          <span className="text-sm text-gray-700">Atender clientes automaticamente com Julia (IA)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.notifySales} onChange={e => setConfig({ ...config, notifySales: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-go-600 focus:ring-go-500" />
          <span className="text-sm text-gray-700"><ShoppingCart className="w-4 h-4 inline mr-1" />Notificar quando receber vendas</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Boas-vindas</label>
          <textarea value={config.welcomeMessage} onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })} className="input-field h-24" />
          <p className="text-xs text-gray-400 mt-1">Use {'{loja}'} para o nome da sua loja</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt da Julia (comportamento)</label>
          <textarea value={config.juliaPrompt} onChange={e => setConfig({ ...config, juliaPrompt: e.target.value })} className="input-field h-24" placeholder={WHATSAPP_SYSTEM_PROMPT} />
          <p className="text-xs text-gray-400 mt-1">Personalize como a Julia deve responder. Deixe vazio para usar o prompt padrão.</p>
        </div>
      </div>

      {/* Test Julia */}
      <div className="card !p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Send className="w-5 h-5 text-blue-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Testar Julia</h2><p className="text-sm text-gray-500">Simule uma conversa no WhatsApp</p></div>
        </div>
        <div className="flex gap-2">
          <input value={testMsg} onChange={e => setTestMsg(e.target.value)} className="input-field flex-1" placeholder="Digite uma mensagem de cliente..." onKeyDown={e => e.key === 'Enter' && testJuliaReply()} />
          <button onClick={testJuliaReply} disabled={testingJulia} className="btn-primary flex items-center gap-2">
            {testingJulia ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} Testar
          </button>
        </div>
        {juliaReply && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-purple-600" /><span className="text-sm font-medium text-purple-900">Julia responde:</span></div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{juliaReply}</p>
          </div>
        )}
      </div>

      {/* Setup Guide */}
      <div className="card !p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><ExternalLink className="w-5 h-5 text-blue-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Como Configurar</h2></div>
        </div>
        <ol className="space-y-3 mt-4 text-sm text-gray-600">
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>Crie conta em <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-go-600 hover:underline">green-api.com</a></li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>Crie instância e escaneie QR Code</li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>Copie Instance ID e Token, cole acima</li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>Ative "Atender com Julia" e personalize o prompt</li>
          <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>Ative notificações de vendas para receber alertas no WhatsApp</li>
        </ol>
      </div>
    </div>
  );
}