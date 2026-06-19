import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Loader2 } from 'lucide-react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const JULIA_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJkr-rqY4NQ35f4kh4_0WLwfBYV8OlnMTJzQ&s';

const SYSTEM_PROMPT = `Você é a Julia, assistente virtual do GoPay, uma plataforma de checkout e pagamentos. 
Você ajuda vendedores com:
- Dúvidas sobre pagamentos e gateways (AbacatePay, KryptGateway, PixGo)
- Sugestões para criar produtos e links de pagamento
- Ideias para personalizar o checkout (banner, cores, quiz, etc)
- Dicas de vendas e marketing digital
- Suporte técnico sobre a plataforma

Seja amigável, direta e útil. Responda em português do Brasil.
Se não souber algo, sugira entrar em contato com o suporte via email.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  'Como configurar um gateway?',
  'Dicas para aumentar vendas',
  'O que é white label?',
  'Como criar um checkout',
  'Ideias para meu banner',
  'Taxas do GoPay',
];

export function AIChat({ context = 'general', onSuggestion }: { context?: string; onSuggestion?: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou a Julia, assistente do GoPay. Como posso ajudar? 💚' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: `${SYSTEM_PROMPT}\nContexto atual: ${context}` },
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar. Tente novamente!';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erro de conexão. Tente novamente!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (onSuggestion) {
      onSuggestion(prompt);
      setOpen(false);
    } else {
      sendMessage(prompt);
    }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-xl 
          flex items-center justify-center hover:scale-105 active:scale-95 transition-all overflow-hidden border-2 border-white">
          <img src={JULIA_AVATAR} alt="Julia" className="w-full h-full object-cover" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-r from-go-500 to-primary-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img src={JULIA_AVATAR} alt="Julia" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm">Julia</p>
                <p className="text-xs text-white/70">Suporte 24h • Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px] bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user' 
                    ? 'bg-go-500 text-white rounded-br-md' 
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'assistant' ? (
                      <img src={JULIA_AVATAR} alt="Julia" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-70">{msg.role === 'assistant' ? 'Julia' : 'Você'}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-go-500" />
                    <span className="text-sm text-gray-400">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, i) => (
                  <button key={i} onClick={() => handleQuickPrompt(p)}
                    className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-full hover:bg-go-50 hover:text-go-700 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Digite sua mensagem..."
                className="flex-1 input-field !py-2.5 !px-4 text-sm" />
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                className="bg-go-500 text-white p-2.5 rounded-xl hover:bg-go-600 transition-colors disabled:opacity-50">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
