const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'tarifa_user',
  password: process.env.DB_PASS || 'tarifa_password',
  database: process.env.DB_NAME || 'tarifa_social',
});

// Basic endpoint to check health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Tarifa Social Conectada rodando.' });
});

// --- Mock OCR Endpoints ---

// Mock: Processar Fatura de Água
app.post('/api/ocr/processar-fatura', (req, res) => {
  // Simula um delay de processamento
  setTimeout(() => {
    res.json({
      matricula: '12345678',
      consumo_m3: 8,
      nome: 'João Silva',
      sucesso: true
    });
  }, 1500);
});

// Mock: Processar Documento de Identidade
app.post('/api/ocr/processar-documento', (req, res) => {
  setTimeout(() => {
    res.json({
      cpf: '111.222.333-44',
      nome: 'João Silva',
      sucesso: true
    });
  }, 1500);
});

// --- Endpoints de CRUD ---

// Listar Solicitações
app.get('/api/solicitacoes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.nome, u.telefone 
      FROM solicitacoes s 
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      ORDER BY s.data_criacao DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar solicitações' });
  }
});

// Criar Solicitação (pode ser anônima via QR Code público)
app.post('/api/solicitacoes', async (req, res) => {
  const { matricula, dados_ocr, fotos, origem_campanha_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO solicitacoes (matricula, dados_ocr, fotos, origem_campanha_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [matricula, dados_ocr, fotos, origem_campanha_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar solicitação' });
  }
});

// Criar Usuário (Aciona a Trigger de vinculação)
app.post('/api/usuarios', async (req, res) => {
  const { nome, email, telefone, senha_hash, matricula } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, telefone, senha_hash, matricula) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, matricula`,
      [nome, email, telefone, senha_hash, matricula]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Aprovar/Recusar Solicitação
app.put('/api/solicitacoes/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // DEFERIDO, RECUSADO
  try {
    const result = await pool.query(
      'UPDATE solicitacoes SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar solicitação' });
  }
});

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
