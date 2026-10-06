-- TrocaTicket - banco de dados
-- Grupo Ticketudo
--
-- Baseado no DER do projeto (usuario, evento, local, categoria, ingresso,
-- pedido, item_pedido e pagamento) com as tabelas que o fluxo do site pede:
-- lotes com teto de revenda, fornecedores, credenciamento, servicos,
-- solicitacoes e o chat.
--
-- Para criar do zero:  mysql -u root -p < trocaticket.sql

DROP DATABASE IF EXISTS trocaticket;
CREATE DATABASE trocaticket DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE trocaticket;

-- --------------------------------------------------------
-- Pessoas
-- --------------------------------------------------------

CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(120) NOT NULL,
  email      VARCHAR(160) NOT NULL UNIQUE,
  cpf        VARCHAR(14)  NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  telefone   VARCHAR(20),
  tipo       ENUM('comprador','organizador','fornecedor','adm') NOT NULL DEFAULT 'comprador',
  criado_em  TIMESTAMP NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Fornecedores e credenciamento
-- --------------------------------------------------------

CREATE TABLE fornecedor (
  id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario    INT NOT NULL UNIQUE,
  nome_empresa  VARCHAR(140) NOT NULL,
  cnpj          VARCHAR(18)  NOT NULL UNIQUE,
  descricao     TEXT,
  -- espelha a ultima solicitacao analisada, pra nao ter que varrer o historico
  situacao      ENUM('nao_solicitado','em_analise','credenciado','recusado')
                NOT NULL DEFAULT 'nao_solicitado',
  criado_em     TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_fornecedor_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE credenciamento (
  id_credenciamento INT AUTO_INCREMENT PRIMARY KEY,
  id_fornecedor INT NOT NULL,
  id_adm        INT NULL,
  status        ENUM('em_analise','aprovado','recusado') NOT NULL DEFAULT 'em_analise',
  observacao    TEXT,
  solicitado_em TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  revisado_em   DATETIME NULL,
  CONSTRAINT fk_credenciamento_fornecedor FOREIGN KEY (id_fornecedor)
    REFERENCES fornecedor (id_fornecedor) ON DELETE CASCADE,
  CONSTRAINT fk_credenciamento_adm FOREIGN KEY (id_adm)
    REFERENCES usuario (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE servico (
  id_servico    INT AUTO_INCREMENT PRIMARY KEY,
  id_fornecedor INT NOT NULL,
  nome          VARCHAR(140) NOT NULL,
  descricao     TEXT,
  preco         DECIMAL(10,2) NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_servico_fornecedor FOREIGN KEY (id_fornecedor)
    REFERENCES fornecedor (id_fornecedor) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Eventos
-- --------------------------------------------------------

CREATE TABLE categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- O organizador digita o local ao cadastrar o evento. A tabela existe
-- porque o mesmo lugar se repete entre eventos; a chave abaixo faz o
-- segundo evento no mesmo endereco reaproveitar a linha em vez de
-- duplicar.
CREATE TABLE local_evento (
  id_local INT AUTO_INCREMENT PRIMARY KEY,
  nome     VARCHAR(140) NOT NULL,
  cidade   VARCHAR(80)  NOT NULL,
  estado   CHAR(2)      NOT NULL,
  endereco VARCHAR(200) NOT NULL,
  CONSTRAINT uq_local UNIQUE (nome, cidade, estado)
) ENGINE=InnoDB;

CREATE TABLE evento (
  id_evento      INT AUTO_INCREMENT PRIMARY KEY,
  id_organizador INT NOT NULL,
  id_local       INT NOT NULL,
  id_categoria   INT NOT NULL,
  nome           VARCHAR(160) NOT NULL,
  descricao      TEXT,
  data_hora      DATETIME NOT NULL,
  -- o evento so fica publico depois que um adm aprova
  status         ENUM('rascunho','em_analise','aprovado','recusado')
                 NOT NULL DEFAULT 'rascunho',
  motivo_recusa  TEXT,
  id_adm_revisor INT NULL,
  revisado_em    DATETIME NULL,
  criado_em      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_evento_organizador FOREIGN KEY (id_organizador)
    REFERENCES usuario (id_usuario),
  CONSTRAINT fk_evento_local FOREIGN KEY (id_local)
    REFERENCES local_evento (id_local),
  CONSTRAINT fk_evento_categoria FOREIGN KEY (id_categoria)
    REFERENCES categoria (id_categoria),
  CONSTRAINT fk_evento_adm FOREIGN KEY (id_adm_revisor)
    REFERENCES usuario (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- O lote cruza os dois eixos de venda:
--   setor = onde a pessoa fica  (pista, camarote, cadeira inferior)
--   nome  = a fase da venda     (1o lote, 2o lote, ultima chamada)
-- Entao "Pista / 2o lote" e uma linha, com o seu proprio preco, a sua
-- quantidade e a janela de dias em que fica a venda.
CREATE TABLE lote (
  id_lote        INT AUTO_INCREMENT PRIMARY KEY,
  id_evento      INT NOT NULL,
  setor          VARCHAR(60) NOT NULL,
  nome           VARCHAR(80) NOT NULL,
  preco          DECIMAL(10,2) NOT NULL,
  quantidade     INT NOT NULL,
  data_inicio    DATETIME NOT NULL,
  data_fim       DATETIME NOT NULL,
  -- teto de revenda em %: um lote de 100 com margem 20 so pode ser
  -- revendido ate 120. zero trava a revenda no preco original.
  margem_revenda DECIMAL(5,2) NOT NULL DEFAULT 0,
  criado_em      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_lote_evento FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento) ON DELETE CASCADE,
  CONSTRAINT uq_lote UNIQUE (id_evento, setor, nome),
  CONSTRAINT ck_lote_preco CHECK (preco >= 0),
  CONSTRAINT ck_lote_quantidade CHECK (quantidade > 0),
  CONSTRAINT ck_lote_margem CHECK (margem_revenda >= 0),
  CONSTRAINT ck_lote_janela CHECK (data_fim > data_inicio)
) ENGINE=InnoDB;

-- fornecedor particular do organizador, sem conta no site.
-- serve pro adm somar o custo do evento na hora de aprovar.
CREATE TABLE fornecedor_externo (
  id_fornecedor_externo INT AUTO_INCREMENT PRIMARY KEY,
  id_evento INT NOT NULL,
  nome      VARCHAR(140) NOT NULL,
  servico   VARCHAR(140) NOT NULL,
  valor     DECIMAL(10,2) NOT NULL,
  contato   VARCHAR(140),
  CONSTRAINT fk_externo_evento FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE solicitacao_servico (
  id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
  id_evento      INT NOT NULL,
  id_servico     INT NOT NULL,
  mensagem       TEXT,
  valor_proposto DECIMAL(10,2),
  status         ENUM('em_analise','aceita','recusada') NOT NULL DEFAULT 'em_analise',
  criado_em      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  respondido_em  DATETIME NULL,
  CONSTRAINT fk_solicitacao_evento FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_solicitacao_servico FOREIGN KEY (id_servico)
    REFERENCES servico (id_servico),
  CONSTRAINT uq_solicitacao UNIQUE (id_evento, id_servico)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Ingressos, pedidos e pagamento
-- --------------------------------------------------------

CREATE TABLE ingresso (
  id_ingresso INT AUTO_INCREMENT PRIMARY KEY,
  id_evento   INT NOT NULL,
  id_lote     INT NOT NULL,
  -- dono atual. no comeco e o organizador; depois de vendido passa
  -- pro comprador, que por sua vez pode anunciar a revenda.
  id_vendedor INT NOT NULL,
  setor       VARCHAR(60),
  tipo        VARCHAR(40),
  codigo      VARCHAR(40) NOT NULL UNIQUE,
  status      ENUM('disponivel','vendido','a_venda','usado','cancelado')
              NOT NULL DEFAULT 'disponivel',
  preco       DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_ingresso_evento FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_ingresso_lote FOREIGN KEY (id_lote)
    REFERENCES lote (id_lote) ON DELETE CASCADE,
  CONSTRAINT fk_ingresso_vendedor FOREIGN KEY (id_vendedor)
    REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE pedido (
  id_pedido    INT AUTO_INCREMENT PRIMARY KEY,
  id_comprador INT NOT NULL,
  data_pedido  TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  valor_total  DECIMAL(10,2) NOT NULL,
  status       ENUM('aguardando_pagamento','pago','cancelado')
               NOT NULL DEFAULT 'aguardando_pagamento',
  CONSTRAINT fk_pedido_comprador FOREIGN KEY (id_comprador)
    REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- o mesmo ingresso aparece aqui uma vez por venda, com o preco daquela
-- venda. e o historico de revenda do ingresso.
CREATE TABLE item_pedido (
  id_pedido      INT NOT NULL,
  id_ingresso    INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_pedido, id_ingresso),
  CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedido (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_item_ingresso FOREIGN KEY (id_ingresso)
    REFERENCES ingresso (id_ingresso)
) ENGINE=InnoDB;

CREATE TABLE pagamento (
  id_pagamento   INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido      INT NOT NULL,
  metodo         ENUM('pix','cartao','boleto') NOT NULL,
  status         ENUM('pendente','aprovado','recusado') NOT NULL DEFAULT 'pendente',
  valor          DECIMAL(10,2) NOT NULL,
  data_pagamento DATETIME NULL,
  CONSTRAINT fk_pagamento_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedido (id_pedido) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Chat
-- --------------------------------------------------------

-- Um chat nasce de duas formas: preso a uma solicitacao de servico
-- (organizador e fornecedor negociando), ou aberto pelo administrador
-- direto com um usuario. No segundo caso id_solicitacao fica nulo e o
-- assunto diz do que se trata.
CREATE TABLE chat (
  id_chat        INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitacao INT NULL UNIQUE,
  assunto        VARCHAR(140) NULL,
  criado_em      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_chat_solicitacao FOREIGN KEY (id_solicitacao)
    REFERENCES solicitacao_servico (id_solicitacao) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_participante (
  id_chat    INT NOT NULL,
  id_usuario INT NOT NULL,
  PRIMARY KEY (id_chat, id_usuario),
  CONSTRAINT fk_participante_chat FOREIGN KEY (id_chat)
    REFERENCES chat (id_chat) ON DELETE CASCADE,
  CONSTRAINT fk_participante_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE mensagem (
  id_mensagem    INT AUTO_INCREMENT PRIMARY KEY,
  id_chat        INT NOT NULL,
  id_remetente   INT NOT NULL,
  texto_mensagem TEXT NOT NULL,
  criado_em      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  CONSTRAINT fk_mensagem_chat FOREIGN KEY (id_chat)
    REFERENCES chat (id_chat) ON DELETE CASCADE,
  CONSTRAINT fk_mensagem_remetente FOREIGN KEY (id_remetente)
    REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- Indices de apoio as consultas mais usadas
-- --------------------------------------------------------

CREATE INDEX ix_evento_status    ON evento (status, data_hora);
CREATE INDEX ix_lote_evento      ON lote (id_evento, data_inicio, data_fim);
CREATE INDEX ix_ingresso_lote    ON ingresso (id_lote, status);
CREATE INDEX ix_ingresso_dono    ON ingresso (id_vendedor, status);
CREATE INDEX ix_pedido_comprador ON pedido (id_comprador, data_pedido);
CREATE INDEX ix_mensagem_chat    ON mensagem (id_chat, criado_em);
CREATE INDEX ix_fornecedor_sit   ON fornecedor (situacao);
