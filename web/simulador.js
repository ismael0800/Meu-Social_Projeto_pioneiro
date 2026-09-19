const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const nomesFirst = ['Ana', 'João', 'Maria', 'Pedro', 'Lucas', 'Mariana', 'José', 'Carlos', 'Marcos', 'Fernanda', 'Aline', 'Rafael', 'Diego', 'Bruno', 'Thiago', 'Amanda', 'Juliana', 'Beatriz'];
const nomesLast = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Lopes', 'Mendes'];
const bairros = ['Mocambinho', 'Dirceu', 'Macaúba', 'São Pedro', 'Promorar', 'Santa Maria da Codipi', 'Parque Piauí', 'Itararé', 'Lourival Parente', 'Cristo Rei'];
const cidades = ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Altos'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCpf() {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
}

function generateMatricula() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function run() {
  console.log('Iniciando simulação de dados...');

  // 1. Criar novas Campanhas QR Code
  console.log('Gerando Campanhas QR...');
  const campanhas = [];
  for (let i = 1; i <= 10; i++) {
    const campanha = await prisma.campanhaQr.create({
      data: {
        codigo: `QR-SIMULADO-${Date.now()}-${i}`,
        titulo: `Ação Social ${randomElement(bairros)}`,
        descricao: `Mutirão de recadastramento simulado`,
        municipio: randomElement(cidades),
        bairro: randomElement(bairros),
        validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        status: 'Ativo',
        funcionario: 'João Auditor',
      }
    });
    campanhas.push(campanha);
  }

  // 2. Criar 320 Beneficiários
  console.log('Gerando 320 beneficiários...');
  const beneficiariosIds = [];
  for (let i = 0; i < 320; i++) {
    const nome = `${randomElement(nomesFirst)} ${randomElement(nomesLast)} ${randomElement(nomesLast)}`;
    const user = await prisma.beneficiario.create({
      data: {
        nome: nome,
        cpf: generateCpf(),
        senha: '123',
        matricula: generateMatricula(),
        endereco: `Rua Simulação, ${Math.floor(Math.random() * 1000)}`,
        cidade: randomElement(cidades),
        bairro: randomElement(bairros),
        cep: '64000-000',
        telefone: `86999${Math.floor(100000 + Math.random() * 900000)}`
      }
    });
    beneficiariosIds.push(user.id);
  }

  // 3. Criar 400 Solicitações
  console.log('Gerando 400 solicitações e documentos...');
  const statusOptions = ['Pendente', 'Pendente', 'Em Análise', 'Aprovada', 'Aprovada', 'Recusada'];
  let qrCount = 0;

  for (let i = 0; i < 400; i++) {
    const isQr = Math.random() > 0.4; // 60% chance de ser via QR Code
    const origem = isQr ? 'QR_CODE' : 'APP';
    const campanhaId = isQr ? randomElement(campanhas).id : null;
    const status = randomElement(statusOptions);

    if (isQr) qrCount++;

    const solicitacao = await prisma.solicitacao.create({
      data: {
        beneficiarioId: randomElement(beneficiariosIds),
        status: status,
        funcionario: status !== 'Pendente' ? 'João Auditor' : null,
        origem: origem,
        campanhaId: campanhaId,
        assinaturaValida: true,
        dataCriacao: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Distribui nos ultimos 30 dias
      }
    });

    // Criar documentos fictícios para a solicitação
    const docs = ['rg', 'cadUnico', 'fatura'];
    for (const d of docs) {
      await prisma.documento.create({
        data: {
          solicitacaoId: solicitacao.id,
          tipo: d,
          descricao: `Documento simulado de ${d}`,
          url: `/uploads/simulado_${d}.jpg`,
          status: status === 'Aprovada' ? 'Aprovado' : (status === 'Recusada' ? 'Recusado' : 'Pendente')
        }
      });
    }

    // Criar histórico básico
    await prisma.historicoLog.create({
      data: {
        solicitacaoId: solicitacao.id,
        acao: `Solicitação criada via ${origem}`,
      }
    });
  }

  console.log(`\n================================`);
  console.log(`✅ Simulação finalizada com sucesso!`);
  console.log(`Criados 320 novos Beneficiários.`);
  console.log(`Criadas ${campanhas.length} Campanhas QR.`);
  console.log(`Criadas 400 novas Solicitações (${qrCount} foram feitas via QR Code).`);
  console.log(`================================`);
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
