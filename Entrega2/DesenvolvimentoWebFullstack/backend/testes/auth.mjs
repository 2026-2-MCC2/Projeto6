import assert from 'node:assert/strict'
import test from 'node:test'
import { codigoConfere, codigoExpirado, hashCodigo } from '../lib/recovery.js'
import { validarCredencialGoogle } from '../lib/google.js'

const resposta = (dados, ok = true) => ({
  ok,
  json: async () => dados,
})

test('recuperacao aceita somente o codigo correto e nao expirado', () => {
  const segredo = 'segredo-de-teste'
  const hash = hashCodigo('123456', segredo)
  assert.equal(codigoConfere('123456', hash, segredo), true)
  assert.equal(codigoConfere('654321', hash, segredo), false)
  assert.equal(codigoExpirado(Date.now() - 1), true)
  assert.equal(codigoExpirado(Date.now() + 60_000), false)
})

test('Google exige audiencia e e-mail verificado', async () => {
  const buscar = async () =>
    resposta({
      aud: 'client-id',
      email: 'Pessoa@Example.com',
      email_verified: 'true',
      name: 'Pessoa Example',
    })
  assert.deepEqual(await validarCredencialGoogle('credential', 'client-id', buscar), {
    nome: 'Pessoa Example',
    email: 'pessoa@example.com',
  })

  const naoVerificado = async () => resposta({
    aud: 'client-id',
    email: 'pessoa@example.com',
    email_verified: 'false',
  })
  assert.equal(await validarCredencialGoogle('credential', 'client-id', naoVerificado), null)
})
