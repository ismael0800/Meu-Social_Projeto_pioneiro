'use server';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getSolicitacaoById(id: string) {
  const sol = await prisma.solicitacao.findUnique({
    where: { id },
    include: {
      beneficiario: true,
      documentos: true,
      historico: { orderBy: { dataHora: 'desc' } }
    }
  });
  return sol;
}

export async function registrarLogDb(solicitacaoId: string, acao: string, usuario: string) {
  await prisma.historicoLog.create({
    data: {
      solicitacaoId,
      acao,
      usuario
    }
  });
}
