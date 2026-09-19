-- Tabela de Usuários (Cidadãos e Administradores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    matricula VARCHAR(50),
    perfil VARCHAR(20) DEFAULT 'cidadao', -- cidadao ou admin
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campanhas de QR Code geradas pelo painel admin
CREATE TABLE campanhas_qrcode (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitações de Tarifa Social
CREATE TABLE solicitacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    matricula VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, DEFERIDO, RECUSADO
    dados_ocr JSONB,
    fotos JSONB, -- { "fachada": "url", "parede": "url", "piso": "url" }
    origem_campanha_id INTEGER REFERENCES campanhas_qrcode(id),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para Vincular Solicitações Anônimas a um Novo Usuário
CREATE OR REPLACE FUNCTION vincular_solicitacoes_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário recém-criado tiver uma matrícula associada
    IF NEW.matricula IS NOT NULL THEN
        UPDATE solicitacoes
        SET usuario_id = NEW.id
        WHERE matricula = NEW.matricula AND usuario_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vincular_solicitacoes
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION vincular_solicitacoes_usuario();

-- Dados Iniciais Mockados
INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ('Administrador Aegea', 'admin@aegea.com.br', 'hash_senha_admin', 'admin');
INSERT INTO campanhas_qrcode (descricao) VALUES ('Campanha Bairro Mocambinho');
INSERT INTO solicitacoes (matricula, status, dados_ocr, fotos) VALUES 
('12345678', 'PENDENTE', '{"consumo_m3": 8, "nome": "João Silva"}', '{"fachada": "base64...", "parede": "base64...", "piso": "base64..."}');
