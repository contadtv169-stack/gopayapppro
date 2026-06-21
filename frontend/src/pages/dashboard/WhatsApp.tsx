import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Save, RefreshCw, Bot, ShoppingCart, Send, Settings, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { getJuliaReply, WHATSAPP_SYSTEM_PROMPT } from '../../services/groqService';

interface Contact {
  number: string;
  name: string;
}

interface ChatMessage {
  from: 'contact' | 'me';
  text: string;
  timestamp: number;
}

const STORAGE_KEY = 'gopay_wa_contacts';
const MSG_KEY = 'gopay_wa_mgs_';

function loadContacts(): Contact[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function loadMessages(phone: string): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(MSG_KEY + phone) || '[]'); } catch { return []; }
}

function saveMessages(phone: string, msgs: ChatMessage[]) {
  localStorage.setItem(MSG_KEY + phone, JSON.stringify(msgs));
}

export default function WhatsApp() {
  const [tab, setTab] = useState<'config' | 'chat'>('config');
  const [config, setConfig] = useState({ instanceId: '', token: '', enabled: false, autoReply: true, notifySales: true, welcomeMessage: 'Ola! Bem-vindo(a) a {loja}! Como posso ajudar?', juliaPrompt: '' });
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingJulia, setTestingJulia] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [juliaReply, setJuliaReply] = useState('');

  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newContactNum, setNewContactNum] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    setContacts(loadContacts());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!config.enabled || tab !== 'chat') return;
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [config.enabled, tab, config.instanceId, config.token, activeContact]);

  useEffect(() => {
    if (activeContact) setMessages(loadMessages(activeContact));
  }, [activeContact]);

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
      const reply = await getJuliaReply([{ role: 'user', content: testMsg }], config.juliaPrompt || WHATSAPP_SYSTEM_PROMPT);
      setJuliaReply(reply);
    } catch { toast.error('Erro ao testar Julia'); }
    setTestingJulia(false);
  };

  // Chat functions
  const addContact = () => {
    const num = newContactNum.replace(/\D/g, '');
    if (!num || num.length < 10) return toast.error('Número inválido');
    if (contacts.find(c => c.number === num)) return toast.error('Contato já existe');
    const updated = [...contacts, { number: num, name: newContactName || num }];
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewContactNum('');
    setNewContactName('');
    setShowAddContact(false);
    toast.success('Contato adicionado!');
  };

  const removeContact = (number: string) => {
    const updated = contacts.filter(c => c.number !== number);
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (activeContact === number) { setActiveContact(null); setMessages([]); }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeContact || !config.instanceId || !config.token) return;
    setSending(true);
    const text = chatInput.trim();
    setChatInput('');
    const msg: ChatMessage = { from: 'me', text, timestamp: Date.now() };
    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(activeContact, updated);
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${activeContact}@c.us`, message: text }),
      });
      if (!res.ok) throw new Error('Send failed');
    } catch {
      toast.error('Erro ao enviar. Verifique a conexão.');
    }
    setSending(false);
  };

  const pollMessages = async () => {
    if (!config.instanceId || !config.token || !config.enabled) return;
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${config.instanceId}/receiveNotification/${config.token}`);
      if (!res.ok || res.status === 204) return;
      const notif = await res.json();
      if (!notif?.body?.messageData?.textMessageData?.textMessage) {
        if (notif?.receiptId) {
          await fetch(`https://api.green-api.com/waInstance${config.instanceId}/deleteNotification/${config.token}/${notif.receiptId}`, { method: 'DELETE' });
        }
        return;
      }
      const incomingText = notif.body.messageData.textMessageData.textMessage;
      const senderNum = (notif.body.senderData?.chatId || '').replace('@c.us', '');
      if (senderNum) {
        const existing = loadMessages(senderNum);
        const msg: ChatMessage = { from: 'contact', text: incomingText, timestamp: Date.now() };
        const updated = [...existing, msg];
        saveMessages(senderNum, updated);
        if (senderNum === activeContact) setMessages(updated);
        // Auto-reply with Julia
        if (config.autoReply) {
          try {
            const reply = await getJuliaReply(
              [...existing.map(m => ({ role: (m.from === 'me' ? 'assistant' : 'user') as 'user' | 'assistant', content: m.text })), { role: 'user', content: incomingText }],
              config.juliaPrompt || WHATSAPP_SYSTEM_PROMPT
            );
            await fetch(`https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: `${senderNum}@c.us`, message: reply }),
            });
            const autoMsg: ChatMessage = { from: 'me', text: reply, timestamp: Date.now() };
            const withAuto = [...updated, autoMsg];
            saveMessages(senderNum, withAuto);
            if (senderNum === activeContact) setMessages(withAuto);
          } catch {}
        }
      }
      if (notif.receiptId) {
        await fetch(`https://api.green-api.com/waInstance${config.instanceId}/deleteNotification/${config.token}/${notif.receiptId}`, { method: 'DELETE' });
      }
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-go-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-500 mt-1">Vendas automatizadas com Julia IA via Green API</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('config')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'config' ? 'bg-go-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Settings className="w-4 h-4 inline mr-1" />Config</button>
          <button onClick={() => setTab('chat')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'chat' ? 'bg-go-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><MessageSquare className="w-4 h-4 inline mr-1" />Conversas</button>
          <label className="flex items-center gap-2 cursor-pointer ml-1">
            <span className="text-sm text-gray-500">{config.enabled ? 'Ativo' : 'Inativo'}</span>
            <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`w-12 h-7 rounded-full transition-colors ${config.enabled ? 'bg-go-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>
      </div>

      {tab === 'config' ? (
        <>
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

          {/* Julia AI */}
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Save className="w-5 h-5 text-blue-600" /></div>
              <div><h2 className="font-semibold text-gray-900">Como Configurar</h2></div>
            </div>
            <ol className="space-y-3 mt-4 text-sm text-gray-600">
              <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>Crie conta em <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-go-600 hover:underline">green-api.com</a></li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>Crie instância e escaneie QR Code</li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>Copie Instance ID e Token, cole acima</li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>Ative "Atender com Julia" e personalize o prompt</li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 bg-go-100 text-go-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</span>Adicione contatos na aba Conversas para iniciar o chat</li>
            </ol>
          </div>
        </>
      ) : (
        /* Chat Tab */
        <div className="card !p-0 overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            {/* Contact list */}
            <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Contatos</h3>
                <button onClick={() => setShowAddContact(!showAddContact)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {showAddContact && (
                <div className="p-3 border-b border-gray-200 bg-white space-y-2">
                  <input value={newContactName} onChange={e => setNewContactName(e.target.value)} className="input-field text-sm" placeholder="Nome" />
                  <input value={newContactNum} onChange={e => setNewContactNum(e.target.value.replace(/\D/g, ''))} className="input-field text-sm" placeholder="Número (5511999999999)" />
                  <div className="flex gap-2">
                    <button onClick={addContact} className="btn-primary text-xs flex-1 !py-1.5">Adicionar</button>
                    <button onClick={() => setShowAddContact(false)} className="btn-secondary text-xs !py-1.5">Cancelar</button>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">Nenhum contato ainda</div>
                ) : contacts.map(c => (
                  <div key={c.number}
                    onClick={() => setActiveContact(c.number)}
                    className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 hover:bg-white transition-colors ${activeContact === c.number ? 'bg-white shadow-sm' : ''}`}>
                    <div className="w-9 h-9 bg-gradient-to-br from-go-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.number}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeContact(c.number); }} className="p-1 hover:bg-gray-100 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {activeContact ? (
                <>
                  <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-go-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{(contacts.find(c => c.number === activeContact)?.name || activeContact).charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contacts.find(c => c.number === activeContact)?.name || activeContact}</p>
                      <p className="text-xs text-gray-400">{activeContact}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    {messages.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.from === 'me' ? 'bg-go-500 text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md shadow-sm'}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="input-field flex-1" placeholder="Digite sua mensagem..." onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()} />
                      <button onClick={sendChatMessage} disabled={sending || !chatInput.trim()} className="btn-primary !px-4">
                        {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Selecione um contato para conversar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}