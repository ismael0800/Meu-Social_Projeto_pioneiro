import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { matricula, cpf, nome, senha, origem, campanhaId, documentos } = data;

    let beneficiario = await prisma.beneficiario.findUnique({ where: { cpf } });
    if (!beneficiario) {
      beneficiario = await prisma.beneficiario.create({
        data: { 
          cpf, 
          matricula, 
          nome: nome || 'Cidadão Não Identificado',
          senha: senha || '123'
        }
      });
    } else if (senha) {
      // Atualiza a senha se enviada e o beneficiário já existe
      await prisma.beneficiario.update({
        where: { id: beneficiario.id },
        data: { senha }
      });
    }

    const solicitacao = await prisma.solicitacao.create({
      data: {
        beneficiarioId: beneficiario.id,
        origem: origem || 'APP',
        campanhaId: campanhaId || null,
        assinaturaValida: true,
        status: 'Pendente',
      }
    });

    if (documentos && Array.isArray(documentos)) {
      for (const doc of documentos) {
        await prisma.documento.create({
          data: {
            solicitacaoId: solicitacao.id,
            tipo: doc.tipo,
            url: doc.url,
          }
        });
      }
    }

    await prisma.historicoLog.create({
      data: {
        solicitacaoId: solicitacao.id,
        acao: 'Solicitação criada via App',
      }
    });

    return NextResponse.json({ success: true, id: solicitacao.id });
  } catch (error) {
    console.error('Erro na criação de solicitação:', error);
    return NextResponse.json({ success: false, message: 'Erro interno' }, { status: 500 });
  }
}