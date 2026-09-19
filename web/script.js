const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.campanhaQr.create({
    data: {
      codigo: 'QR-202609-001',
      titulo: 'Mutirão Centro',
      descricao: 'Campanha de testes encerrada',
      municipio: 'Teresina',
      bairro: 'Centro',
      validade: new Date('2025-12-31'),
      funcionario: 'Admin',
      status: 'Finalizado'
    }
  });
  await prisma.campanhaQr.create({
    data: {
      codigo: 'QR-202609-002',
      titulo: 'Ação Social Mocambinho',
      descricao: 'Campanha antiga',
      municipio: 'Teresina',
      bairro: 'Mocambinho',
      validade: new Date('2025-10-10'),
      funcionario: 'Admin',
      status: 'Cancelado'
    }
  });
  await prisma.campanhaQr.create({
    data: {
      codigo: 'QR-202609-003',
      titulo: 'Apresentação pioneiros',
      descricao: 'Testa real para o grande Dia!',
      municipio: 'Teresina',
      bairro: 'Dirceu Arcoverde',
      validade: new Date('2026-12-31'),
      funcionario: 'Equipe Pioneiros',
      status: 'Ativo'
    }
  });
  console.log('Seed feito com sucesso');
}
main().catch(console.error).finally(() => prisma.$disconnect());
