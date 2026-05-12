#!/usr/bin/env node

/**
 * Script para enviar correo de prueba
 * Uso: node send_test_email.js <email_destino>
 */

require('dotenv').config();
const { enviarCorreo } = require('./src/services/mailService');

async function main() {
  const emailDestino = process.argv[2] || 'acasa@quito-turismo.gob.ec';

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   📧 ENVIAR CORREO DE PRUEBA - SISTRA                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📮 Enviando correo de prueba a: ${emailDestino}\n`);

  try {
    const asunto = '🧪 SISTRA - Correo de Prueba';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="margin: 0;">✅ Correo de Prueba - SISTRA</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Estimado usuario,</p>
          <p style="font-size: 14px; color: #555;">
            Este es un correo de prueba enviado desde el Sistema de Seguimiento de Trámites Administrativos (SISTRA).
          </p>
          <div style="background: #f0f0f0; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Información del envío:</strong></p>
            <p style="margin: 5px 0; font-size: 13px;">
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}
            </p>
            <p style="margin: 5px 0; font-size: 13px;">
              <strong>Destinatario:</strong> ${emailDestino}
            </p>
          </div>
          <p style="font-size: 14px; color: #555;">
            Si recibió este correo, significa que la configuración de notificaciones por correo está funcionando correctamente.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/admin/configuracion-notificaciones"
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Ver Configuración
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 5px 0;">
              Este es un mensaje automático del Sistema de Seguimiento de Trámites Administrativos (SISTRA).
            </p>
            <p style="margin: 5px 0;">
              © 2026 Quito Turismo. Todos los derechos reservados.
            </p>
            <p style="margin: 5px 0;">
              Por favor, no responda a este correo. Si tiene preguntas, contacte al administrador.
            </p>
          </div>
        </div>
      </div>
    `;

    const resultado = await enviarCorreo(emailDestino, asunto, html);

    console.log('✅ CORREO ENVIADO EXITOSAMENTE\n');
    console.log('📋 Detalles:');
    console.log(`   • Para: ${emailDestino}`);
    console.log(`   • Asunto: ${asunto}`);
    console.log(`   • Message ID: ${resultado.messageId}`);
    console.log(`   • Respuesta: ${resultado.response}`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR AL ENVIAR CORREO\n');
    console.error('Detalles del error:');
    console.error(`   ${error.message}\n`);

    if (error.code === 'ENOTFOUND') {
      console.error('💡 Sugerencia: Verifica que SMTP_HOST está configurado correctamente en .env');
    } else if (error.code === 'EAUTH') {
      console.error('💡 Sugerencia: Verifica que SMTP_USER y SMTP_PASSWORD son correctos en .env');
    }

    console.error('\n');
    process.exit(1);
  }
}

main();
