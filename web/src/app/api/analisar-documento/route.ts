import { GoogleGenAI } from '@google/genai';

// Instancia o cliente da Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tipo, imageBase64 } = data; // tipo: 'rg' ou 'cadUnico'

    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'Imagem base64 não fornecida.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // O modelo adequado para imagens e texto
    const model = 'gemini-3.6-flash';

    let prompt = '';
    if (tipo === 'rg') {
      prompt = `Você é um assistente de validação de documentos para a Tarifa Social de Água. 
Analise a imagem enviada. Se não for um documento de identidade válido no Brasil (RG, CNH, ou documento de identificação oficial com foto), responda apenas: INVALIDO.
Se for um documento de identidade válido, extraia o Nome e o CPF (se disponível) e retorne os dados no formato JSON restrito sem markdown: {"valido": true, "nome": "nome lido", "cpf": "cpf lido"}`;
    } else if (tipo === 'fatura') {
      prompt = `Você é um assistente de validação de faturas de água.
Analise a imagem enviada. Se não for uma conta/fatura de água (ex: Águas de Teresina, Sabesp, Aegea, etc), responda apenas: INVALIDO.
Se for uma fatura válida, extraia o nome do titular, a matrícula, o consumo em m3 (apenas número) e o valor total (apenas número com ponto decimal). Retorne em JSON restrito: {"valido": true, "nomeTitular": "nome lido", "matricula": "matrícula lida", "consumoM3": 10.5, "valorTotal": 50.90}`;
    } else {
      prompt = `Você é um assistente de validação de documentos para a Tarifa Social de Água.
Analise a imagem enviada. Se não for um comprovante de benefício social válido no Brasil (como Cartão Bolsa Família, Folha Resumo do CadÚnico, Benefício de Prestação Continuada - BPC), responda apenas: INVALIDO.
Se for válido, tente extrair o nome do titular ou NIS e retorne no formato JSON restrito sem markdown: {"valido": true, "nomeTitular": "nome lido", "nis": "nis lido"}`;
    }

    // Processar a base64 (removendo prefixo data:image/jpeg;base64, se existir)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    const outputText = response.text?.trim() || '';

    if (outputText === 'INVALIDO') {
      return new Response(JSON.stringify({ 
        success: true, 
        valido: false, 
        mensagem: 'A Inteligência Artificial não identificou um documento válido.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const parsed = JSON.parse(outputText);
      return new Response(JSON.stringify({ 
        success: true, 
        valido: true, 
        dados: parsed 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ 
        success: true, 
        valido: false, 
        mensagem: 'Não foi possível ler os dados do documento com segurança.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Erro na validação da IA:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
