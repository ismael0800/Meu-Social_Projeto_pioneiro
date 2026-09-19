import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a base64 Data URI
    const mimeType = file.type || 'image/jpeg';
    const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ success: true, url: base64Url });
  } catch (error) {
    console.error('Erro no upload base64:', error);
    return NextResponse.json({ success: false, message: 'Erro ao fazer upload' }, { status: 500 });
  }
}