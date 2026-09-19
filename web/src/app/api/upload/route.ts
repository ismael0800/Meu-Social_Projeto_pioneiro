import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = Date.now() + '-' + file.name.replace(/\s+/g, '_');
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, url: '/uploads/' + filename });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ success: false, message: 'Erro ao fazer upload' }, { status: 500 });
  }
}