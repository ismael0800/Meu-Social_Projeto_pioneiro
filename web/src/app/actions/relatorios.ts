'use server';

import { PrismaClient } from '@prisma/client';
import { bairrosTeresina } from '@/data/locations';
import { unstable_noStore as noStore } from 'next/cache';

const prisma = new PrismaClient();

export async function getRelatorioData() {
  noStore();
  const solicitacoes = await prisma.solicitacao.findMany({
    include: { beneficiario: true, historico: { orderBy: { dataHora: 'desc' }, take: 1 } },
    orderBy: { dataCriacao: 'desc' }
  });

  return solicitacoes.map((s, index) => {
    let zona = 'Outros';
    const bairro = s.beneficiario.bairro || 'Desconhecido';
    
    if (s.beneficiario.cidade === 'Teresina') {
      // Tentar inferir a zona a partir do bairro (aproximado)
      const isSul = bairrosTeresina['Zona Sul']?.includes(bairro);
      const isNorte = bairrosTeresina['Zona Norte']?.includes(bairro);
      const isLeste = bairrosTeresina['Zona Leste']?.includes(bairro);
      const isSudeste = bairrosTeresina['Zona Sudeste']?.includes(bairro);
      if (isSul) zona = 'Zona Sul';
      else if (isNorte) zona = 'Zona Norte';
      else if (isLeste) zona = 'Zona Leste';
      else if (isSudeste) zona = 'Zona Sudeste';
      else zona = 'Centro';
    } else {
      zona = 'Interior';
    }

    let dataEncerramento = '-';
    if (s.status === 'Aprovada' || s.status === 'Recusada') {
      const histFim = s.historico.find(h => h.acao.includes('Aprovada') || h.acao.includes('Recusada'));
      dataEncerramento = histFim ? histFim.dataHora.toISOString().split('T')[0] : s.dataCriacao.toISOString().split('T')[0];
    }

    // Campos técnicos (Simulados de forma determinística baseada no ID para não mudar ao recarregar)
    const seed = parseInt(s.id.replace(/\D/g, '')) || index;
    const tamanhoImovel = seed % 2 === 0 ? '≤ 50 m²' : '> 50 m²';
    const estruturas = ['Alvenaria Compacta', 'Taipa', 'Madeira', 'Mista'];
    const estrutura = estruturas[seed % 4];
    const pisos = ['Cimento Queimado', 'Chão Batido', 'Cerâmica Simples'];
    const piso = pisos[seed % 3];
    const eco = ((seed % 40) + 20).toFixed(2);

    return {
      id: s.id,
      titular: s.beneficiario.nome,
      cpf: s.beneficiario.cpf,
      dataEntrada: s.dataCriacao.toISOString().split('T')[0],
      dataEncerramento,
      municipio: s.beneficiario.cidade || 'Teresina',
      zona,
      bairro,
      status: s.status,
      analista: s.funcionario || 'Sistema',
      canal: s.origem === 'APP' ? 'App Mobile' : s.origem === 'QR_CODE' ? 'Ações de Rua (QR)' : 'Agentes (Offline)',
      tamanhoImovel,
      estrutura,
      piso,
      economiaMensalEstimada: eco
    };
  });
}
