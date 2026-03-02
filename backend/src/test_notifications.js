#!/usr/bin/env node

/**
 * Script para probar el sistema de notificaciones
 * Uso: node src/test_notifications.js
 */

require('dotenv').config();
const { 
  obtenerDocumentosExpirados,
  obtenerDocumentosProximosAExpirar,
  obtenerUsuario,
  agruparPorUsuario,
  procesarNotificacionesExpirados,
  procesarNotificacionesUnDiaAntes
} = require('./services/notificationService');
const { verificarConexion } = require('./services/mailService');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 PRUEBA DEL SISTEMA DE NOTIFICACIONES - SISTRA         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Verificar configuración
  console.log('📋 Verificando configuración...\n');
  
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.MAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST;

  if (!smtpUser || !smtpPass) {
    console.error('❌ ERROR: Variables de entorno SMTP_USER/SMTP_PASSWORD o MAIL_USER/MAIL_PASS no configuradas');
    console.error('   Edita el archivo .env y reinicia\n');
    process.exit(1);
  }

  console.log(`✅ SMTP_USER: ${smtpUser}`);
  console.log(`✅ SMTP_HOST: ${smtpHost}`);
  console.log(`✅ CRON_SCHEDULE: ${process.env.CRON_SCHEDULE}\n`);

  // Verificar conexión SMTP
  console.log('🔗 Verificando conexión SMTP...\n');
  const conectado = await verificarConexion();
  
  if (!conectado) {
    console.error('❌ No se pudo conectar al servidor SMTP');
    console.error('   Verifica tu configuración de correo en .env\n');
    process.exit(1);
  }

  // Obtener documentos
  console.log('📊 Buscando documentos...\n');
  const docsExpirados = await obtenerDocumentosExpirados();
  const docsProximos = await obtenerDocumentosProximosAExpirar();

  console.log(`   Documentos expirados encontrados: ${docsExpirados.length}`);
  if (docsExpirados.length > 0) {
    console.log('   📌 Detalles:');
    docsExpirados.forEach(doc => {
      console.log(`     - ${doc.numero_documento} (usuario_id: ${doc.usuario_id})`);
    });
  }

  console.log(`\n   Documentos próximos a expirar: ${docsProximos.length}`);
  if (docsProximos.length > 0) {
    console.log('   📌 Detalles:');
    docsProximos.forEach(doc => {
      console.log(`     - ${doc.numero_documento} (usuario_id: ${doc.usuario_id})`);
    });
  }

  console.log('\n' + '═'.repeat(60) + '\n');

  // Ejecutar notificaciones
  console.log('📧 Enviando notificaciones de prueba...\n');
  
  const resultadoExpirados = await procesarNotificacionesExpirados();
  const resultadoProximos = await procesarNotificacionesUnDiaAntes();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ PRUEBA COMPLETADA\n');
  console.log('Resumen:');
  console.log(`  Expirados   → Procesados: ${resultadoExpirados.procesados} | Enviados: ${resultadoExpirados.enviados} | Errores: ${resultadoExpirados.errores}`);
  console.log(`  Próximos    → Procesados: ${resultadoProximos.procesados} | Enviados: ${resultadoProximos.enviados} | Errores: ${resultadoProximos.errores}`);
  console.log('\n');

  // Sugerencias
  if (resultadoExpirados.enviados === 0 && resultadoProximos.enviados === 0) {
    console.log('ℹ️ Sugerencias para probar:\n');
    console.log('  1. Insertar datos de ejemplo: mysql < script_insertar_usuarios.sql');
    console.log('  2. Crear documentos reasignados con fechas próximas/pasadas');
    console.log('  3. Asignar usuario_id a los documentos\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
