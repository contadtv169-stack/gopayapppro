const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqCompletion(messages: { role: string; content: string }[], system: string, model = 'llama-3.1-8b-instant', maxTokens = 1024) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages.slice(-8)],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function getJuliaReply(messages: { role: string; content: string }[], systemPrompt: string) {
  try {
    return await groqCompletion(messages, systemPrompt) || 'Desculpe, não consegui processar.';
  } catch {
    return '❌ Erro de conexão com a IA.';
  }
}

export async function getImageAnalysis(imageInfo: { avgBrightness: number; avgContrast: number; dominantColor: string; width: number; height: number; hasFace: boolean }) {
  const systemPrompt = `Você é um especialista em edição de imagens e fotografia.
Analise os dados técnicos da imagem e retorne UM JSON válido com recomendações de filtros:
{
  "brightness": 0-200,
  "contrast": 0-200,
  "saturation": 0-200,
  "hue": -180-180,
  "blur": 0-20,
  "sharpen": 0-100,
  "temperature": -100-100,
  "vignette": 0-100,
  "suggestedFilter": "none|grayscale|sepia|vintage|cinema|dramatic|soft|hdr",
  "description": "breve descrição do que foi ajustado (máx 60 caracteres)"
}`;
  const info = `Imagem: ${imageInfo.width}x${imageInfo.height}, brilho médio ${Math.round(imageInfo.avgBrightness)}, contraste ${Math.round(imageInfo.avgContrast)}, cor dominante ${imageInfo.dominantColor}, rosto detectado: ${imageInfo.hasFace}`;
  try {
    const reply = await groqCompletion([{ role: 'user', content: info }], systemPrompt, 'llama-3.1-8b-instant', 512);
    return JSON.parse(reply.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

export async function getFilterSuggestion(imageDescription: string) {
  const systemPrompt = `Com base na descrição da imagem, sugira UM filtro e ajustes perfeitos para ela.
Retorne APENAS JSON: { "filter": "none|grayscale|sepia|vintage|cinema|dramatic|soft|hdr", "reason": "motivo curto" }`;
  try {
    const reply = await groqCompletion([{ role: 'user', content: imageDescription }], systemPrompt, 'llama-3.1-8b-instant', 256);
    return JSON.parse(reply.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

export async function getImagePrompt(description: string) {
  const systemPrompt = `Gere um prompt detalhado em inglês para criar uma imagem profissional baseada na descrição.
Retorne APENAS o prompt, sem explicações. Máximo 200 caracteres.
Inclua estilo, iluminação, cor, composição.`;
  try {
    return await groqCompletion([{ role: 'user', content: description }], systemPrompt, 'llama-3.1-8b-instant', 256);
  } catch {
    return 'A professional photo of ' + description;
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
