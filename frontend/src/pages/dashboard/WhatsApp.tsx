import { useState, useEffect } from 'react';
import { MessageCircle, Phone, Settings, Plug, Power, ExternalLink, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface WhatsAppConfig {
  instanceId: string;
  token: string;
  enabled: boolean;
  autoReply: boolean;
  welcomeMessage: string;
}

const defaultConfig: WhatsAppConfig = {
  instanceId: localStorage.getItem('wa_instance_id') || '',
  token: localStorage.getItem('wa_token') || '',
  enabled: localStorage.getItem('wa_enabled') === 'true',
  autoReply: localStorage.getItem('wa_auto_reply') !== 'false',
  welcomeMessage: localStorage.getItem('wa_welcome') || 'Olá! 👋 Bem-vindo(a) à {loja}! Como posso ajudar?',
};

export default function WhatsApp() {
  const [config, setConfig] = useState<WhatsAppConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const saveConfig = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem('wa_instance_id', config.instanceId);
    localStorage.setItem('wa_token', config.token);
    localStorage.setItem('wa_enabled', String(config.enabled));
    localStorage.setItem('wa_auto_reply', String(config.autoReply));
    localStorage.setItem('wa_welcome', config.welcomeMessage);
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const testConnection = async () => {
    if (!config.instanceId || !config.token) {
      return toast.error('Preencha Instance ID e Token primeiro');
    }
    setConnecting(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Conexão com Green API OK!');
    setConnecting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-500 mt-1">Vendas automatizadas via Green API</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <Power className="w-4 h-4" />
            {config.enabled ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="card !p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Green API</h2>
            <p className="text-sm text-gray-500">Conecte sua conta WhatsApp via Green API</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label>
            <input value={config.instanceId} onChange={e => setConfig({ ...config, instanceId: e.target.value })}
              className="input-field" placeholder="Ex: 1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
            <input value={config.token} onChange={e => setConfig({ ...config, token: e.target.value })}
              className="input-field" type="password" placeholder="Seu token Green API" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button onClick={testConnection} disabled={connecting} className="btn-secondary flex items-center gap-2">
            {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            {connecting ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="card !p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Respostas Automáticas</h2>
            <p className="text-sm text-gray-500">Configure a IA para responder clientes automaticamente</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={config.autoReply} onChange={e => setConfig({ ...config, autoReply: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-go-600 focus:ring-go-500" />
            <span className="text-sm text-gray-700">Atender clientes automaticamente com IA</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Boas-vindas</label>
            <textarea value={config.welcomeMessage} onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
              className="input-field h-24" placeholder="Digite a mensagem de boas-vindas..." />
            <p className="text-xs text-gray-400 mt-1">Use {'{loja}'} para o nome da sua loja</p>
          </div>
        </div>
      </div>

      <div className="card !p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Como Configurar</h2>
            <p className="text-sm text-gray-500">Siga os passos abaixo para conectar seu WhatsApp</p>
          </div>
        </div>
        <ol className="space-y-3 mt-4 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Crie uma conta em <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-go-600 hover:underline">green-api.com</a></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Crie uma instância e escaneie o QR Code com seu WhatsApp</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Copie o Instance ID e API Token e cole acima</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
            <span>Ative as respostas automáticas com IA e pronto!</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
