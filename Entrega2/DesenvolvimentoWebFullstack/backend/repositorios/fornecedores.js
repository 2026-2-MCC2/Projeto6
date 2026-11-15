// SQL dos fornecedores e dos servicos que eles oferecem.
const pool = require('../config/bd');

// o fornecedor dono da conta logada (null se ainda nao pediu credenciamento)
async function doUsuario(idUsuario, conexao = pool) {
  const [linhas] = await conexao.query('select * from fornecedor where id_usuario = ?', [idUsuario]);
  return linhas[0] || null;
}

// vitrine: so quem ja passou pelo credenciamento aparece
async function listarCredenciados() {
  const [linhas] = await pool.query(
    `select f.id_fornecedor, f.nome_empresa, f.descricao, f.cidade, f.estado, f.link,
            u.email, coalesce(f.telefone, u.telefone) as telefone,
            count(s.id_servico) as total_servicos
       from fornecedor f
       join usuario u on u.id_usuario = f.id_usuario
       left join servico s on s.id_fornecedor = f.id_fornecedor and s.ativo = true
      where f.situacao = 'credenciado'
      group by f.id_fornecedor, u.email, u.telefone
      order by f.nome_empresa`,
  );
  return linhas;
}

async function servicosAtivosDeCredenciado(idFornecedor) {
  const [linhas] = await pool.query(
    `select s.* from servico s
       join fornecedor f on f.id_fornecedor = s.id_fornecedor
      where s.id_fornecedor = ? and s.ativo = true and f.situacao = 'credenciado'`,
    [idFornecedor],
  );
  return linhas;
}

async function criarServico({ idFornecedor, nome, descricao, preco }) {
  const [r] = await pool.query(
    'insert into servico (id_fornecedor, nome, descricao, preco) values (?, ?, ?, ?)',
    [idFornecedor, nome, descricao, preco],
  );
  return r.insertId;
}

async function servicosDoFornecedor(idFornecedor) {
  const [linhas] = await pool.query('select * from servico where id_fornecedor = ?', [idFornecedor]);
  return linhas;
}

module.exports = { doUsuario, listarCredenciados, servicosAtivosDeCredenciado, criarServico, servicosDoFornecedor };
