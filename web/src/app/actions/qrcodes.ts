'use server';

import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from './auth';

const prisma = new PrismaClient();

export async function getCampanhasQr() {
  try {
    const campanhas = await prisma.campanhaQr.findMany({
      orderBy: { criadoEm: 'desc' }
    });

    return {
      success: true,
      campanhas: campanhas.map(c => ({
        ...c,
        dataCriacao: c.criadoEm.toISOString().split('T')[0],
        validade: c.validade.toISOString().split('T')[0]
      }))
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro ao buscar campanhas' };
  }
}

export async function criarCampanhaQr(data: { titulo: string, descricao: string, municipio: string, bairro: string, validade: string }) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Não autorizado' };

  try {
    const hoje = new Date();
    const prefix = `QR-${hoje.getFullYear()}${String(hoje.getMonth()+1).padStart(2, '0')}`;
    
    const ultimaCampanha = await prisma.campanhaQr.findFirst({
      where: {
        codigo: {
          startsWith: prefix
        }
      },
      orderBy: {
        codigo: 'desc'
      }
    });

    let nextNumber = 1;
    if (ultimaCampanha) {
      const parts = ultimaCampanha.codigo.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    const codigo = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    const novaCampanha = await prisma.campanhaQr.create({
      data: {
        codigo,
        titulo: data.titulo,
        descricao: data.descricao,
        municipio: data.municipio,
        bairro: data.bairro,
        validade: new Date(data.validade),
        funcionario: user.nome,
        status: 'Ativo'
      }
    });

    return { 
      success: true, 
      campanha: {
        ...novaCampanha,
        dataCriacao: novaCampanha.criadoEm.toISOString().split('T')[0],
        validade: novaCampanha.validade.toISOString().split('T')[0]
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro ao criar campanha' };
  }
}

export async function toggleStatusCampanha(id: string, statusAtual: string) {
  const user = await getCurrentUser();
  if (!user || user.cargo !== 'Chefe') return { success: false, message: 'Apenas chefes podem alterar status' };

  try {
    const novoStatus = statusAtual === 'Ativo' ? 'Cancelado' : (statusAtual === 'Cancelado' ? 'Ativo' : 'Finalizado');
    const atualizado = await prisma.campanhaQr.update({
      where: { id },
      data: { status: novoStatus }
    });
    return { success: true, status: atualizado.status };
  } catch (error) {
    return { success: false, message: 'Erro ao atualizar status' };
  }
}
