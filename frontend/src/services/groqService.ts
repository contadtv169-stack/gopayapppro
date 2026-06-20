const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function getJuliaReply(messages: { role: string; content: string }[], systemPrompt: string) {
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar.';
  } catch {
    return '❌ Erro de conexão com a IA.';
  }
}

export const WHATSAPP_SYSTEM_PROMPT = `Você é a Julia, assistente virtual de vendas e suporte do GoPay. 
Você atende clientes no WhatsApp de um vendedor. Suas funções:
- Responder dúvidas sobre produtos (preço, entrega, garantia)
- Ajudar com o processo de compra e pagamento via Pix
- Fornecer suporte amigável e educado
- Coletar informações do cliente (nome, email) quando necessário
- Se não souber responder, peça para o cliente aguardar que o vendedor responderá

Seja educada, profissional e responda em português do Brasil. Use linguagem natural e calorosa.`;
