'use server';

import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from './auth';

const prisma = new PrismaClient();

export async function getEquipe() {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Não autorizado' };

  try {
    const equipe = await prisma.usuario.findMany({
      orderBy: { nome: 'asc' }
    });
    return { success: true, equipe };
  } catch (error) {
    return { success: false, message: 'Erro ao buscar equipe' };
  }
}

export async function addUsuario(nome: string, email: string, cargo: string) {
  const user = await getCurrentUser();
  if (!user || user.cargo !== 'Chefe') return { success: false, message: 'Permissão negada' };

  try {
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        cargo,
        senha: '123' // Senha padrão para novos
      }
    });
    return { success: true, usuario: novoUsuario };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, message: 'Este email já está cadastrado.' };
    }
    return { success: false, message: 'Erro ao criar usuário' };
  }
}

export async function toggleStatusUsuario(id: string, ativoAtual: boolean) {
  const user = await getCurrentUser();
  if (!user || user.cargo !== 'Chefe') return { success: false, message: 'Permissão negada' };

  if (user.id === id) {
    return { success: false, message: 'Você não pode desativar a si mesmo.' };
  }

  try {
    const atualizado = await prisma.usuario.update({
      where: { id },
      data: { ativo: !ativoAtual }
    });
    return { success: true, ativo: atualizado.ativo };
  } catch (error) {
    return { success: false, message: 'Erro ao alterar status' };
  }
}
