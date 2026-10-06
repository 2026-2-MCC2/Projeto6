// Unico lugar do front que fala HTTP. Se a API mudar de endereco ou o jeito
// de autenticar mudar, muda aqui e so aqui.

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const CHAVE = 'trocaticket:token'

export class ErroApi extends Error {
  constructor(mensagem, status, corpo) {
    super(mensagem)
    this.status = status
    this.corpo = corpo
  }
}

export function lerToken() {
  return localStorage.getItem(CHAVE)
}

export function guardarToken(token) {
  localStorage.setItem(CHAVE, token)
}

export function limparToken() {
  localStorage.removeItem(CHAVE)
}

export async function pedir(metodo, rota, corpo) {
  const token = lerToken()

  let resposta
  try {
    resposta = await fetch(BASE + rota, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroApi('Nao consegui falar com o servidor. Ele esta rodando?', 0, null)
  }

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    // token vencido ou invalido: derruba a sessao
    if (resposta.status === 401 && token) limparToken()
    throw new ErroApi(dados?.erro || `Erro ${resposta.status}`, resposta.status, dados)
  }

  return dados
}

export const get = (rota) => pedir('GET', rota)
export const post = (rota, corpo) => pedir('POST', rota, corpo)
export const del = (rota) => pedir('DELETE', rota)
