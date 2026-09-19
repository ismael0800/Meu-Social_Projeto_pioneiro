'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSolicitacoesList() {
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      include: {
        beneficiario: true,
        historico: {
          orderBy: { dataHora: 'desc' },
          take: 1
        }
      },
      orderBy: { dataCriacao: 'desc' }
    });

  return solicitacoes.map(s => {
    let dataEncerramento = null;
    if (s.status === 'Aprovada' || s.status === 'Recusada') {
      const histFim = s.historico.find(h => h.acao.includes('Aprovada') || h.acao.includes('Recusada'));
      dataEncerramento = histFim ? histFim.dataHora.toISOString().split('T')[0] : s.dataCriacao.toISOString().split('T')[0];
    }

    return {
      id: s.id,
      nome: s.beneficiario.nome,
      cpf: s.beneficiario.cpf,
      cidade: s.beneficiario.cidade || 'Teresina',
      bairro: s.beneficiario.bairro || 'Desconhecido',
      dataCriacao: s.dataCriacao.toISOString().split('T')[0],
      dataAtualizacao: s.historico[0] ? s.historico[0].dataHora.toISOString().split('T')[0] : s.dataCriacao.toISOString().split('T')[0],
      dataEncerramento,
      status: s.status,
      funcionario: 'Sistema (Auto)' // No mock users assigned yet
    };
  });
  } catch (error) {
    console.error("ERRO GRAVE NO BANCO DE DADOS (getSolicitacoesList):", error);
    return [];
  }
}
