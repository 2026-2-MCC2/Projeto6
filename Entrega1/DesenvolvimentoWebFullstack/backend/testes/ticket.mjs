import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { calcularTicket } = require('../regras/ticket')

test('calcula equilibrio e alvo para os publicos minimo e maximo', () => {
  assert.deepEqual(calcularTicket({ custoTotal: 50000, publico: 500, margem: 0.2 }), {
    ticketEquilibrio: 100,
    ticketAlvo: 125,
  })
  assert.deepEqual(calcularTicket({ custoTotal: 50000, publico: 1000, margem: 0.2 }), {
    ticketEquilibrio: 50,
    ticketAlvo: 62.5,
  })
})

test('arredonda o resultado para cima ao centavo', () => {
  assert.equal(calcularTicket({ custoTotal: 10, publico: 3, margem: 0 }).ticketEquilibrio, 3.34)
})

test('aceita margem zero e rejeita entradas invalidas', () => {
  assert.equal(calcularTicket({ custoTotal: 10, publico: 2, margem: 0 }).ticketAlvo, 5)
  assert.throws(() => calcularTicket({ custoTotal: 10, publico: 0, margem: 0 }), /publico/)
  assert.throws(() => calcularTicket({ custoTotal: 10, publico: 2, margem: 1 }), /margem/)
  assert.throws(() => calcularTicket({ custoTotal: -1, publico: 2, margem: 0 }), /custo/)
})
