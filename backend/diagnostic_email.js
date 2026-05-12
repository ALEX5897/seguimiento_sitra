#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar correos y logs
 */

require('dotenv').config();
const db = require('./src/db');
const { enviarCorreo, verificarConexion } = require('./src/services/mailService');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 DIAGNÓSTICO DE CORREOS - SISTRA                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Verificar conexión SMTP
    console.log('📡 1. Verificando conexión SMTP...');
    const conectado = await verificarConexion();
    if (conectado) {
      console.log('   ✅ SMTP conectado\n');
    } else {
      console.log('   ❌ Error de SMTP\n');
    }

    // 2. Verificar tabla de logs
    console.log('📊 2. Revisando tabla de notificaciones_log...');
    const [logs] = await db.query(`
      SELECT
        id, tipo, email_destino, estado, fecha_envio, detalles
      FROM notificaciones_log
      ORDER BY fecha_envio DESC
      LIMIT 10
    `);

    if (logs.length === 0) {
      console.log('   ℹ️  No hay registros en notificaciones_log\n');
    } else {
      console.log(`   ✅ ${logs.length} registros encontrados:\n`);
      logs.forEach((log, i) => {
        console.log(`   ${i + 1}. Tipo: ${log.tipo}`);
        console.log(`      Email: ${log.email_destino}`);
        console.log(`      Estado: ${log.estado}`);
        console.log(`      Fecha: ${log.fecha_envio}`);
        if (log.detalles) {
          try {
            const details = JSON.parse(log.detalles);
            if (details.messageId) {
              console.log(`      Message ID: ${details.messageId}`);
            }
          } catch (e) {
            console.log(`      Detalles: ${log.detalles.substring(0, 50)}...`);
          }
        }
        console.log('');
      });
    }

    // 3. Verificar configuración SMTP del .env
    console.log('⚙️  3. Configuración actual:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
    console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    console.log(`   MAIL_TO_PRUEBA: ${process.env.MAIL_TO_PRUEBA}\n`);

    // 4. Enviar correo de prueba
    console.log('📧 4. Enviando correo de prueba...');
    const emailPrueba = 'acasa@quito-turismo.gob.ec';
    const asunto = '🧪 TEST - Diagnóstico SISTRA - ' + new Date().toLocaleString('es-ES');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">✅ Correo de Diagnóstico</h2>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd;">
          <p><strong>Este correo fue enviado por el script de diagnóstico.</strong></p>
          <p><strong>Información del envío:</strong></p>
          <ul>
            <li>Fecha: ${new Date().toLocaleString('es-ES')}</li>
            <li>Usuario SMTP: ${process.env.SMTP_USER}</li>
            <li>Servidor: ${process.env.SMTP_HOST}</li>
          </ul>
          <p style="background: #f0f0f0; padding: 10px; border-left: 4px solid #28a745;">
            Si recibes este correo, el sistema está funcionando correctamente.
          </p>
          <p style="color: #666; font-size: 12px;">
            Mensaje automático - No responder
          </p>
        </div>
      </div>
    `;

    const resultado = await enviarCorreo(emailPrueba, asunto, html);
    console.log(`   ✅ Correo enviado`);
    console.log(`   Message ID: ${resultado.messageId}`);
    console.log(`   Response: ${resultado.response}\n`);

    // 5. Verificar logs nuevamente
    console.log('📝 5. Verificando si se registró en logs...');
    const [logsNuevos] = await db.query(`
      SELECT * FROM notificaciones_log
      WHERE email_destino = '${emailPrueba}'
      ORDER BY fecha_envio DESC
      LIMIT 3
    `);

    if (logsNuevos.length > 0) {
      console.log(`   ✅ ${logsNuevos.length} registros encontrados\n`);
    } else {
      console.log('   ⚠️  No se encontraron registros nuevos\n');
    }

    console.log('═════════════════════════════════════════════════════════════');
    console.log('💡 Recomendaciones:');
    console.log('   1. Revisa la carpeta de SPAM en tu correo');
    console.log('   2. Verifica que el dominio no esté bloqueado por Office 365');
    console.log('   3. Ejecuta este script periodicamente para monitorear');
    console.log('═════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
