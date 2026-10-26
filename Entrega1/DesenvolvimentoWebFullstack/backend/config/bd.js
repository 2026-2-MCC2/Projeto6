// Conexao com o Postgres (Supabase ou banco local embutido).
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

// as colunas de data nao guardam fuso. O banco (now(), current_timestamp)
// e o Node (new Date) precisam estar no mesmo horario, senao a janela dos
// lotes erra em 3 horas quando o backend roda num servidor em UTC.
const FUSO = (process.env.DB_TIMEZONE || 'America/Sao_Paulo').replace(/'/g, '');
process.env.TZ = FUSO;

const connectionString = process.env.DATABASE_URL;

// Dois modos:
// - com DATABASE_URL: conecta no Postgres de verdade (Supabase). E o modo
//   da Vercel e de quem quiser usar o banco compartilhado.
// - sem DATABASE_URL: usa um Postgres embutido (PGlite) que roda dentro do
//   proprio Node e grava em backend/.banco-local. Nao precisa de senha nem
//   de rede, entao funciona ate na rede da faculdade.
let banco;
if (connectionString) {
  banco = bancoRemoto(connectionString);
} else if (process.env.VERCEL) {
  throw new Error('DATABASE_URL nao configurada na Vercel (Settings > Environment Variables).');
} else {
  banco = bancoLocal();
}

function bancoRemoto(url) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new Pool({
    connectionString: url,
    // o Supabase exige SSL; banco local normalmente nao tem
    ssl: local ? false : { rejectUnauthorized: false },
    // na Vercel cada funcao abre o proprio pool, entao poucas conexoes
    max: process.env.VERCEL ? 3 : 10,
  });

  return {
    async conectar() {
      const cliente = await pool.connect();
      if (!cliente.fusoAjustado) {
        await cliente.query(`set timezone to '${FUSO}'`);
        cliente.fusoAjustado = true;
      }
      return cliente;
    },
    end: () => pool.end(),
  };
}

function bancoLocal() {
  const fs = require('fs');
  const path = require('path');
  const pasta = path.join(__dirname, '..', '.banco-local');
  const sqls = path.join(__dirname, '..', '..', '..', 'tabelas_bd');

  let pronto;
  function abrir() {
    pronto ??= (async () => {
      const { PGlite } = await import('@electric-sql/pglite');
      const db = await PGlite.create(pasta);
      await db.exec(`set timezone to '${FUSO}'`);
      // primeira vez: cria as tabelas e o seed sozinho
      const { rows } = await db.query("select to_regclass('public.usuario') as tabela");
      if (!rows[0].tabela) {
        console.log('banco local vazio: criando tabelas e seed...');
        for (const nome of ['trocaticket.sql', 'seed.sql']) {
          await db.exec(fs.readFileSync(path.join(sqls, nome), 'utf8'));
        }
        console.log('banco local pronto. login do adm: admin@trocaticket.com.br / admin123');
      }
      return db;
    })();
    return pronto;
  }

  // O PGlite tem uma conexao so. Para as transacoes de uma requisicao nao
  // se misturarem com as de outra, cada "cliente" pega a vez numa fila e so
  // devolve no release(). Na pratica e como um pool de tamanho 1.
  let fila = Promise.resolve();

  return {
    async conectar() {
      const db = await abrir();
      let liberar;
      const vez = fila;
      fila = new Promise((r) => (liberar = r));
      await vez;

      return {
        async query(texto, valores) {
          // sem parametros pode ter varios comandos (ex.: arquivo .sql)
          const r = valores && valores.length
            ? await db.query(texto, valores)
            : (await db.exec(texto)).at(-1) || { rows: [], fields: [] };
          return { rows: r.rows, fields: r.fields, rowCount: r.affectedRows ?? r.rows.length };
        },
        release: () => liberar(),
      };
    },
    async end() {
      if (pronto) await (await pronto).close();
    },
  };
}

const conectar = () => banco.conectar();

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

  end: () => banco.end(),
};
