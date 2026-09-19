import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, message: 'API Key do Gemini não configurada.' }, { status: 500 });
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY;
    
    const payload = {
      contents: [{
        parts: [
          { text: 'Você é um assistente de leitura de contas de água. Analise esta fatura da Águas de Teresina. Extraia apenas dois valores: o Consumo faturado em m3 (apenas o número) e o Valor total da fatura (apenas o número decimal). Retorne ESTRITAMENTE um JSON neste formato: { "consumoM3": 15, "valorTotal": 45.90 }' },
          { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Falha ao extrair dados do Gemini');
    }

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return NextResponse.json({ success: true, dados: parsed });

  } catch (error) {
    console.error('Erro na API do Guardião:', error);
    return NextResponse.json({ success: false, message: 'Erro ao processar fatura com a IA' }, { status: 500 });
  }
}