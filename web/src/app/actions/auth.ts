'use server';

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function login(email: string, senha: string) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (!usuario.ativo) {
      return { success: false, message: 'Seu usuário está desativado.' };
    }

    if (usuario.senha !== senha) {
      return { success: false, message: 'Senha incorreta.' };
    }

    // Criar um token simples em Base64
    const tokenPayload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: false, // Localhost MVP
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    return { success: true, cargo: usuario.cargo };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Erro interno no servidor.' };
  }
}

export async function logout() {
  cookies().delete('auth_token');
  return { success: true };
}

export async function getCurrentUser() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    return decoded;
  } catch (e) {
    return null;
  }
}
