import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { audioBase64 } = data;

    if (!audioBase64) {
      return new Response(JSON.stringify({ success: false, error: 'Áudio não fornecido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada no servidor Vercel.");
    }

    const model = 'gemini-1.5-flash';
    
    // Configuração do prompt para extrair os 3 dados (Nome, CPF, Matrícula) do áudio
    const prompt = `Você é um assistente de acessibilidade para solicitação da Tarifa Social de Água.
Abaixo está o áudio de um cidadão tentando fazer a solicitação.
Extraia os seguintes dados se estiverem presentes no áudio:
- nome (string)
- cpf (string, formatado ou apenas os números)
- matricula (string, a matrícula da conta de água)
- renda (number, a renda familiar dita, se houver)
- pessoasNaCasa (number, quantidade de pessoas que moram na casa)

Retorne EXATAMENTE UM JSON válido e NADA MAIS. O JSON deve ter as chaves acima. Se uma informação não for dita, preencha com null.
Exemplo de saída: {"nome": "João da Silva", "cpf": "123.456.789-00", "matricula": "987654", "renda": 1500, "pessoasNaCasa": 4}`;

    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const mimeType = audioBase64.match(/^data:(audio\/\w+);base64,/)?.[1] || 'audio/m4a';

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    let outputText = response.text?.trim() || '{}';
    if (outputText.startsWith('```json')) {
      outputText = outputText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(outputText);

    return new Response(JSON.stringify({ 
      success: true, 
      dados: parsed 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro na transcrição de áudio:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
