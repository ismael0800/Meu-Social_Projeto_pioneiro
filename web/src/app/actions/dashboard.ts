'use server';

import { PrismaClient } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

const prisma = new PrismaClient();

export async function getBeneficiariosData() {
  noStore();
  try {
    const beneficiarios = await prisma.beneficiario.findMany({
      include: {
        solicitacoes: {
          include: { historico: { orderBy: { dataHora: 'asc' } } },
          orderBy: { dataCriacao: 'desc' },
          take: 1
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

  return beneficiarios.map(b => {
    const lastSol = b.solicitacoes[0];
    const statusMap: Record<string, string> = {
      'Aprovada': 'ATIVO',
      'Em Análise': 'EM_ANALISE',
      'Pendente': 'EM_ANALISE',
      'Recusada': 'RECUSADO'
    };
    
    return {
      id: b.id,
      nome: b.nome,
      matricula: b.matricula || 'N/A',
      origem: lastSol?.origem || 'APP',
      detalheOrigem: lastSol?.origem === 'APP' ? 'Cadastro via App' : 'Outro',
      status: lastSol ? statusMap[lastSol.status] || 'EM_ANALISE' : 'EM_ANALISE',
      dataInscricao: b.criadoEm.toLocaleDateString('pt-BR'),
      cpf: b.cpf,
      endereco: b.endereco || 'Endereço não informado',
      historico: lastSol?.historico.map(h => ({
        data: h.dataHora.toLocaleString('pt-BR'),
        evento: h.acao
      })) || []
    };
  });
  } catch (error) {
    console.error("ERRO GRAVE NO BANCO DE DADOS (getBeneficiariosData):", error);
    return [];
  }
}
export async function getDashboardStats() {
  noStore();
  try {
    const solicitacoes = await prisma.solicitacao.findMany({
      include: { beneficiario: true },
      orderBy: { dataCriacao: 'asc' }
    });

  const total = solicitacoes.length;
  const pendentes = solicitacoes.filter(s => s.status === 'Pendente' || s.status === 'Em Análise').length;
  const aprovadas = solicitacoes.filter(s => s.status === 'Aprovada').length;
  const recusadas = solicitacoes.filter(s => s.status === 'Recusada').length;

  // Agrupar por Mês para o Gráfico de Evolução
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const evolutionMap: Record<string, { name: string, recebidas: number, deferidas: number }> = {};
  
  solicitacoes.forEach(s => {
    const date = new Date(s.dataCriacao);
    const mName = months[date.getMonth()];
    if (!evolutionMap[mName]) {
      evolutionMap[mName] = { name: mName, recebidas: 0, deferidas: 0 };
    }
    evolutionMap[mName].recebidas += 1;
    if (s.status === 'Aprovada') {
      evolutionMap[mName].deferidas += 1;
    }
  });
  
  // Transformar map em array ordenado pelos meses presentes
  const evolution = Object.values(evolutionMap);

  // Ranking de Bairros
  const bairrosCount: Record<string, number> = {};
  solicitacoes.forEach(s => {
    const b = s.beneficiario.bairro || 'Outros';
    bairrosCount[b] = (bairrosCount[b] || 0) + 1;
  });
  const rankingBairros = Object.entries(bairrosCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Perfil da Moradia (Simulado baseado na origem para ter dados)
  const perfilMoradia = [
    { name: 'App (Auto-cadastro)', value: solicitacoes.filter(s => s.origem === 'APP').length },
    { name: 'Ações de Rua (QR)', value: solicitacoes.filter(s => s.origem === 'QR_CODE').length },
    { name: 'Agentes (Offline)', value: solicitacoes.filter(s => s.origem === 'OFFLINE').length }
  ].filter(p => p.value > 0);

    return { total, pendentes, aprovadas, recusadas, evolution, rankingBairros, perfilMoradia, solicitacoes };
  } catch (error) {
    console.error("ERRO GRAVE NO BANCO DE DADOS (getDashboardStats):", error);
    return null;
  }
}
