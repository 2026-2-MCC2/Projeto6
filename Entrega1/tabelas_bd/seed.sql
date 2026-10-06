-- Dados iniciais do TrocaTicket.
-- Rodar depois do trocaticket.sql:  mysql -u root -p trocaticket < seed.sql

USE trocaticket;

-- A conta de administrador nao pode ser criada pelo cadastro do site
-- (a rota /auth/cadastro so aceita comprador, organizador e fornecedor),
-- entao o primeiro adm entra por aqui.
-- login: admin@trocaticket.com.br  /  senha: admin123
INSERT INTO usuario (nome, email, cpf, senha_hash, tipo) VALUES
  ('Administrador', 'admin@trocaticket.com.br', '00000000000',
   '$2b$10$Xm5xsNNOsnNbHJGcd3QSauUq6GOwx7mFClKhz9zwgpCAVKuBRWr5W', 'adm');

INSERT INTO categoria (nome) VALUES
  ('Show'), ('Festival'), ('Teatro'), ('Stand-up'), ('Esporte'), ('Congresso');

-- Local nao entra no seed de proposito: quem cadastra o evento digita o
-- lugar, e a tabela se preenche sozinha conforme os eventos entram.
