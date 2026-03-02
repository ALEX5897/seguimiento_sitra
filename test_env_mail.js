// test_env_mail.js
// Script para verificar variables de entorno y enviar correo de prueba
require('dotenv').config({ path: './backend/.env' });
const nodemailer = require('nodemailer');

console.log('--- Verificación de variables de entorno ---');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('MAIL_TO_PRUEBA:', process.env.MAIL_TO_PRUEBA);

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.error('❌ Faltan variables SMTP en .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true'
  }
});

async function enviarCorreoPrueba() {
  try {
    const info = await transporter.sendMail({
      from: `"SISTRA - Prueba" <${process.env.EMAIL_FROM}>`,
      to: process.env.MAIL_TO_PRUEBA || 'acasa@quito-turismo.gob.ec',
      subject: 'Prueba de correo SISTRA',
      text: 'Este es un correo de prueba enviado desde el sistema SISTRA.',
      html: '<b>Este es un correo de prueba enviado desde el sistema SISTRA.</b>'
    });
    console.log('✅ Correo de prueba enviado:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar correo de prueba:', error);
  }
}

enviarCorreoPrueba();
