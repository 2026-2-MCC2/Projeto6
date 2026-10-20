// Conexao com o Postgres do Supabase.
//
// As rotas foram escritas no estilo do mysql2 (placeholder "?", resultado
// em [linhas], insertId, affectedRows, getConnection/beginTransaction).
// Este arquivo traduz esse estilo pro driver "pg", entao as rotas quase nao
// precisaram mudar.
const { Pool, types } = require('pg');

// count(*) volta como bigint, que o pg entrega como texto. Aqui vira numero,
// igual o mysql fazia. DECIMAL continua texto, como no mysql2.
types.setTypeParser(types.builtins.INT8, (valor) => Number(valor));

// erro de chave unica duplicada no Postgres
const DUPLICADO = '23505';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL nao configurada. Veja o .env.example do backend.');
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

const pool = new Pool({
  connectionString,
  // o Supabase exige SSL; banco local normalmente nao tem
  ssl: local ? false : { rejectUnauthorized: false },
  max: 10,
});

// as colunas de data nao guardam fuso. O banco (now(), current_timestamp)
// e o Node (new Date) precisam estar no mesmo horario, senao a janela dos
// lotes erra em 3 horas quando o backend roda num servidor em UTC.
const FUSO = (process.env.DB_TIMEZONE || 'America/Sao_Paulo').replace(/'/g, '');
process.env.TZ = FUSO;

async function conectar() {
  const cliente = await pool.connect();
  if (!cliente.fusoAjustado) {
    await cliente.query(`set timezone to '${FUSO}'`);
    cliente.fusoAjustado = true;
  }
  return cliente;
}

// troca cada "?" por $1, $2... Array de valores vira lista ("in (?)") e
// array de arrays vira varias linhas ("values ?"), como no mysql2.
function traduzir(sql, params = []) {
  const valores = [];
  let i = 0;
  let saida = '';
  let aspas = null;

  const marcar = (v) => {
    valores.push(v);
    return `$${valores.length}`;
  };

  for (const ch of sql) {
    if (aspas) {
      if (ch === aspas) aspas = null;
      saida += ch;
    } else if (ch === "'" || ch === '"') {
      aspas = ch;
      saida += ch;
    } else if (ch === '?') {
      const p = params[i];
      i += 1;
      if (Array.isArray(p) && Array.isArray(p[0])) {
        saida += p.map((linha) => `(${linha.map(marcar).join(', ')})`).join(', ');
      } else if (Array.isArray(p)) {
        saida += p.map(marcar).join(', ');
      } else {
        saida += marcar(p);
      }
    } else {
      saida += ch;
    }
  }
  return { texto: saida, valores };
}

async function executar(cliente, sql, params) {
  let { texto, valores } = traduzir(sql, params);
  const comando = texto.trim().split(/\s+/)[0].toLowerCase();

  // o Postgres nao tem insertId; pede a linha de volta e pega a primeira
  // coluna (todas as tabelas tem o id como primeira coluna)
  if (comando === 'insert' && !/\breturning\b/i.test(texto)) {
    texto += ' returning *';
  }

  const r = await cliente.query(texto, valores);

  if (comando === 'select' || comando === 'with') {
    return [r.rows, r.fields];
  }
  const primeira = r.rows[0];
  return [
    {
      insertId: primeira ? Object.values(primeira)[0] : undefined,
      affectedRows: r.rowCount,
      rows: r.rows,
    },
  ];
}

module.exports = {
  DUPLICADO,
  conectar,

  async query(sql, params) {
    const cliente = await conectar();
    try {
      return await executar(cliente, sql, params);
    } finally {
      cliente.release();
    }
  },

  async getConnection() {
    const cliente = await conectar();
    return {
      query: (sql, params) => executar(cliente, sql, params),
      beginTransaction: () => cliente.query('begin'),
      commit: () => cliente.query('commit'),
      rollback: () => cliente.query('rollback'),
      release: () => cliente.release(),
    };
  },

  end: () => pool.end(),
};
