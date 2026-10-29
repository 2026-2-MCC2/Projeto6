-- Dados de DEMONSTRACAO do TrocaTicket (FLX-08).
-- Um organizador e dois fornecedores ja credenciados, um evento com itens de
-- custo, outros custos e propostas com valores diferentes, com a cotacao
-- encerrada. Serve para mostrar o fluxo na apresentacao sem digitar tudo.
--
-- Como rodar:
--   no computador: npm run db:demo   (depois do npm run db:reset)
--   no Supabase:   colar este arquivo no SQL Editor e clicar em Run
-- Pode rodar de novo: ele apaga os dados de demonstracao antes de criar.
--
-- Contas (senha de todas: demo1234, so para demonstracao):
--   organizador.demo@demo.trocaticket.com.br
--   som.demo@demo.trocaticket.com.br
--   palco.demo@demo.trocaticket.com.br

begin;

-- limpa a demonstracao anterior (eventos primeiro: itens, custos e propostas vao junto)
delete from evento
 where id_organizador in (select id_usuario from usuario where email like '%@demo.trocaticket.com.br');
delete from mensagem
 where id_remetente in (select id_usuario from usuario where email like '%@demo.trocaticket.com.br');
delete from usuario where email like '%@demo.trocaticket.com.br';

-- contas (senha demo1234)
insert into usuario (nome, email, cpf, senha_hash, telefone, tipo) values
  ('Marina Lopes', 'organizador.demo@demo.trocaticket.com.br', '90000000001',
   '$2b$10$Fga78eijabvFd/kRSAVDDeCk6hlmrvEB5.UK.tX90/sJ471oEL34u', '11987650001', 'organizador'),
  ('Rafael Som', 'som.demo@demo.trocaticket.com.br', '90000000002',
   '$2b$10$Fga78eijabvFd/kRSAVDDeCk6hlmrvEB5.UK.tX90/sJ471oEL34u', '11987650002', 'fornecedor'),
  ('Paula Palco', 'palco.demo@demo.trocaticket.com.br', '90000000003',
   '$2b$10$Fga78eijabvFd/kRSAVDDeCk6hlmrvEB5.UK.tX90/sJ471oEL34u', '11987650003', 'fornecedor');

-- organizador credenciado
insert into organizador (id_usuario, tipo_pessoa, nome_organizacao, cidade, estado, telefone,
                         descricao, publico_medio, situacao)
select id_usuario, 'fisica', 'Marina Lopes Producoes', 'Sao Paulo', 'SP', '11987650001',
       'Produz festivais de musica independente desde 2021.', 1200, 'credenciado'
  from usuario where email = 'organizador.demo@demo.trocaticket.com.br';

insert into organizador_categoria (id_organizador, id_categoria)
select o.id_organizador, c.id_categoria
  from organizador o join usuario u on u.id_usuario = o.id_usuario, categoria c
 where u.email = 'organizador.demo@demo.trocaticket.com.br' and c.nome in ('Show', 'Festival');

-- fornecedores credenciados
insert into fornecedor (id_usuario, nome_empresa, razao_social, cnpj, cidade, estado, telefone,
                        descricao, situacao)
select id_usuario, 'Som & Luz Demo', 'Som e Luz Demo Eventos Ltda', '45123678000108', 'Sao Paulo', 'SP',
       '11987650002', 'Som, luz e projecao para shows de ate 5 mil pessoas.', 'credenciado'
  from usuario where email = 'som.demo@demo.trocaticket.com.br';
insert into fornecedor (id_usuario, nome_empresa, razao_social, cnpj, cidade, estado, telefone,
                        descricao, situacao)
select id_usuario, 'Palco Forte Demo', 'Palco Forte Demo Estruturas Ltda', '78230145000176', 'Campinas', 'SP',
       '11987650003', 'Palcos, tendas, grades e equipe de seguranca.', 'credenciado'
  from usuario where email = 'palco.demo@demo.trocaticket.com.br';

insert into fornecedor_atuacao (id_fornecedor, categoria)
select f.id_fornecedor, a.categoria
  from fornecedor f join usuario u on u.id_usuario = f.id_usuario,
       (values ('som.demo@demo.trocaticket.com.br', 'iluminacao'),
               ('som.demo@demo.trocaticket.com.br', 'estrutura'),
               ('palco.demo@demo.trocaticket.com.br', 'estrutura'),
               ('palco.demo@demo.trocaticket.com.br', 'seguranca'),
               ('palco.demo@demo.trocaticket.com.br', 'iluminacao')) as a(email, categoria)
 where u.email = a.email;

-- os credenciamentos aprovados pelo administrador do seed (rastreabilidade)
insert into credenciamento (id_organizador, id_adm, status, revisado_em)
select o.id_organizador, (select id_usuario from usuario where email = 'admin@trocaticket.com.br'),
       'aprovado', current_timestamp
  from organizador o join usuario u on u.id_usuario = o.id_usuario
 where u.email = 'organizador.demo@demo.trocaticket.com.br';
insert into credenciamento (id_fornecedor, id_adm, status, revisado_em)
select f.id_fornecedor, (select id_usuario from usuario where email = 'admin@trocaticket.com.br'),
       'aprovado', current_timestamp
  from fornecedor f join usuario u on u.id_usuario = f.id_usuario
 where u.email like '%@demo.trocaticket.com.br';

-- o evento, com a cotacao encerrada
insert into local_evento (nome, cidade, estado, endereco)
select 'Parque da Cidade (demo)', 'Sao Paulo', 'SP', 'Av. das Flores, 1000'
 where not exists (select 1 from local_evento where nome = 'Parque da Cidade (demo)'
                     and cidade = 'Sao Paulo' and estado = 'SP');

insert into evento (id_organizador, id_local, id_categoria, nome, descricao, data_inicio, data_fim,
                    publico_minimo, publico_maximo, publico_esperado, margem_lucro, status)
select u.id_usuario,
       (select id_local from local_evento where nome = 'Parque da Cidade (demo)' and cidade = 'Sao Paulo'),
       (select id_categoria from categoria where nome = 'Festival'),
       'Festival Demo TrocaTicket', 'Festival de musica independente com dois palcos.',
       '2027-09-18 14:00:00', '2027-09-18 23:30:00', 800, 2000, 1200, 20, 'cotacao_encerrada'
  from usuario u where u.email = 'organizador.demo@demo.trocaticket.com.br';

insert into item_custo (id_evento, categoria, descricao, quantidade, custo_estimado)
select e.id_evento, i.categoria, i.descricao, i.quantidade, i.custo
  from evento e,
       (values ('iluminacao', 'Iluminacao dos dois palcos', 2, 18000.00),
               ('estrutura', 'Palco principal com cobertura', 1, 25000.00),
               ('seguranca', 'Equipe de seguranca (30 pessoas)', 30, 12000.00)) as i(categoria, descricao, quantidade, custo)
 where e.nome = 'Festival Demo TrocaTicket';

insert into custo_evento (id_evento, tipo, descricao, valor)
select e.id_evento, c.tipo, c.descricao, c.valor
  from evento e,
       (values ('fiscal', 'ISS e taxa de alvara', 6000.00),
               ('operacional', 'Equipe de producao e limpeza', 8000.00),
               ('variavel', 'Pulseiras e copos (estimado para 1.200 pessoas)', 4000.00)) as c(tipo, descricao, valor)
 where e.nome = 'Festival Demo TrocaTicket';

-- propostas com valores diferentes para comparar
insert into proposta (id_item, id_fornecedor, valor, descricao, validade, observacoes)
select i.id_item, f.id_fornecedor, p.valor, p.descricao, date '2027-08-31', p.obs
  from (values ('Iluminacao dos dois palcos', 'som.demo@demo.trocaticket.com.br', 16500.00,
                'Moving heads, refletores LED e operador nos dois palcos', 'Montagem na vespera'),
               ('Iluminacao dos dois palcos', 'palco.demo@demo.trocaticket.com.br', 17800.00,
                'Refletores LED e mesa de luz', null),
               ('Palco principal com cobertura', 'som.demo@demo.trocaticket.com.br', 27000.00,
                'Palco 12x8 m com cobertura e gerador', '50% na assinatura'),
               ('Palco principal com cobertura', 'palco.demo@demo.trocaticket.com.br', 23500.00,
                'Palco 12x8 m com cobertura, montagem e desmontagem', null),
               ('Equipe de seguranca (30 pessoas)', 'palco.demo@demo.trocaticket.com.br', 11000.00,
                '30 segurancas por 10 horas, com supervisor', null)) as p(item, email, valor, descricao, obs)
  join item_custo i on i.descricao = p.item
  join evento e on e.id_evento = i.id_evento and e.nome = 'Festival Demo TrocaTicket'
  join usuario u on u.email = p.email
  join fornecedor f on f.id_usuario = u.id_usuario;

commit;
