import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.historicoLog.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.solicitacao.deleteMany();
  await prisma.beneficiario.deleteMany();
  await prisma.usuario.deleteMany();

  const usuarios = [
    { nome: 'Chefe Teresina', email: 'chefe@aguas.com', senha: '1234', cargo: 'Chefe' },
    { nome: 'Ana Rita', email: 'ana@aguas.com', senha: '1234', cargo: 'Funcionario' },
    { nome: 'Carlos Mendes', email: 'carlos@aguas.com', senha: '1234', cargo: 'Funcionario' },
    { nome: 'Juliana Costa', email: 'juliana@aguas.com', senha: '1234', cargo: 'Funcionario' },
    { nome: 'Marcos Silva', email: 'marcos@aguas.com', senha: '1234', cargo: 'Funcionario' },
    { nome: 'Fernanda Lima', email: 'fernanda@aguas.com', senha: '1234', cargo: 'Funcionario' },
  ];
  for (const u of usuarios) { await prisma.usuario.create({ data: u }); }

  const statusArray = ['Pendente', 'Em Análise', 'Aprovada', 'Recusada'];
  const origens = ['APP', 'QR_CODE', 'OFFLINE'];
  const bairros = ['Mocambinho', 'Dirceu', 'Promorar', 'São Joaquim', 'Santa Maria'];

  for (let i = 1; i <= 40; i++) {
    const num = i.toString().padStart(2, '0');
    const cpf = `000.000.000-${num}`;
    const randomStatus = statusArray[Math.floor(Math.random() * statusArray.length)];
    const randomOrigem = origens[Math.floor(Math.random() * origens.length)];
    const randomBairro = bairros[Math.floor(Math.random() * bairros.length)];
    const temMatricula = Math.random() > 0.2;

    const beneficiario = await prisma.beneficiario.create({
      data: {
        nome: `Cidadão Teste ${num}`,
        cpf: cpf,
        senha: '123',
        matricula: temMatricula ? `MAT100${i}` : null,
        endereco: `Rua Teste ${i}, Quadra ${i}`,
        cidade: 'Teresina',
        bairro: randomBairro,
      }
    });

    const dataCriacao = new Date();
    dataCriacao.setDate(dataCriacao.getDate() - Math.floor(Math.random() * 30));

    const solicitacao = await prisma.solicitacao.create({
      data: {
        beneficiarioId: beneficiario.id,
        status: randomStatus,
        origem: randomOrigem,
        assinaturaValida: Math.random() > 0.3,
        dataCriacao: dataCriacao,
      }
    });

    await prisma.historicoLog.create({
      data: {
        solicitacaoId: solicitacao.id,
        acao: `Solicitação criada via ${randomOrigem}`,
        dataHora: dataCriacao,
      }
    });
  }
  console.log('Seed concluído com sucesso!');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
