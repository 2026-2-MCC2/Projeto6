const nodemailer = require('nodemailer');

let transportador;

function obterTransportador() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER e SMTP_PASS precisam estar configurados para enviar e-mails.');
  }
  transportador ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transportador;
}

async function enviarCodigoRedefinicao(email, codigo) {
  const remetente = process.env.SMTP_FROM || process.env.SMTP_USER;
  await obterTransportador().sendMail({
    from: remetente,
    to: email,
    subject: 'Seu código para redefinir a senha | TrocaTicket',
    text: `Seu código para redefinir a senha é ${codigo}. Ele expira em 15 minutos. Se você não solicitou isso, ignore este e-mail.`,
  });
}

module.exports = { enviarCodigoRedefinicao };
