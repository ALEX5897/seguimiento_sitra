require('dotenv').config();
const mysql = require('mysql2/promise');

// Simular la función de envío de notificaciones que usa la API
async function testApiNotifications() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado\n');

    // Cargar el servicio de notificaciones
    const {
      obtenerDocumentosExpirados,
      obtenerDocumentosProximosAExpirar,
      obtenerPlantilla,
      obtenerConfiguracion,
      obtenerUsuario
    } = require('./src/services/notificationService');

    const config = await obtenerConfiguracion();
    console.log('📋 Configuración cargada:');
    console.log(`  ✓ Activo: ${config.activo}`);
    console.log(`  ✓ Email activo: ${config.notificaciones_email_activas}`);
    console.log(`  ✓ Días retraso: ${config.dias_retraso}\n`);

    // Simular envío de notificaciones expiradas
    console.log('📤 SIMULANDO ENVÍO DE NOTIFICACIONES - DOCUMENTOS EXPIRADOS');
    console.log('═'.repeat(60));

    const docsExpirados = await obtenerDocumentosExpirados();
    console.log(`\n✓ Documentos encontrados: ${docsExpirados.length}\n`);

    let correosExpirados = 0;
    let docsAgrupados = {};

    for (const doc of docsExpirados) {
      const usuario = await obtenerUsuario(doc.usuario_id, doc.reasignado_a);

      if (usuario) {
        if (!docsAgrupados[usuario.id]) {
          docsAgrupados[usuario.id] = { usuario, docs: [] };
        }
        docsAgrupados[usuario.id].docs.push(doc);
      }
    }

    for (const [userId, data] of Object.entries(docsAgrupados)) {
      const { usuario, docs } = data;
      console.log(`📧 Correo para: ${usuario.nombre}`);
      console.log(`   Correo: ${usuario.correo}`);
      console.log(`   Documentos vencidos: ${docs.length}`);
      docs.forEach(doc => {
        const diasRetraso = Math.floor((new Date() - new Date(doc.fecha_max_respuesta)) / (1000 * 60 * 60 * 24));
        console.log(`     • ${doc.numero_documento} - ${diasRetraso} días de retraso`);
      });
      console.log(`   ✅ Correo listo para enviar\n`);
      correosExpirados++;
    }

    // Simular envío de notificaciones próximas
    console.log('\n📤 SIMULANDO ENVÍO DE NOTIFICACIONES - DOCUMENTOS PRÓXIMOS A VENCER');
    console.log('═'.repeat(60));

    const docsProximos = await obtenerDocumentosProximosAExpirar();
    console.log(`\n✓ Documentos encontrados: ${docsProximos.length}\n`);

    let correosProximos = 0;
    let docsAgrupados2 = {};

    for (const doc of docsProximos) {
      const usuario = await obtenerUsuario(doc.usuario_id, doc.reasignado_a);

      if (usuario) {
        if (!docsAgrupados2[usuario.id]) {
          docsAgrupados2[usuario.id] = { usuario, docs: [] };
        }
        docsAgrupados2[usuario.id].docs.push(doc);
      }
    }

    for (const [userId, data] of Object.entries(docsAgrupados2)) {
      const { usuario, docs } = data;
      console.log(`📧 Correo para: ${usuario.nombre}`);
      console.log(`   Correo: ${usuario.correo}`);
      console.log(`   Documentos próximos a vencer: ${docs.length}`);
      docs.forEach(doc => {
        console.log(`     • ${doc.numero_documento} - Vence: ${new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES')}`);
      });
      console.log(`   ✅ Correo listo para enviar\n`);
      correosProximos++;
    }

    // Resumen
    console.log('\n\n📊 RESUMEN DEL ENVÍO SIMULADO');
    console.log('═'.repeat(60));
    console.log(`\n  Notificaciones de documentos expirados: ${correosExpirados} correos`);
    console.log(`  Notificaciones de documentos próximos: ${correosProximos} correos`);
    console.log(`  Total de correos a enviar: ${correosExpirados + correosProximos}`);

    // Verificar SMTP
    console.log('\n\n🔧 CONFIGURACIÓN SMTP');
    console.log('═'.repeat(60));
    console.log(`\n  SMTP_HOST: ${process.env.SMTP_HOST || '❌ NO CONFIGURADO'}`);
    console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
    console.log(`  SMTP_USER: ${process.env.SMTP_USER ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
    console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);

    // Instrucciones
    console.log('\n\n✅ PRÓXIMOS PASOS PARA ENVIAR REALES');
    console.log('═'.repeat(60));
    console.log(`
1. Asegúrate que SMTP está configurado en .env

2. Ir a: http://localhost:5175/admin/notificaciones

3. Sección "Enviar Notificaciones Ahora":
   - ✅ Marcar "📋 Documentos Tarde (Expirados)"
   - ✅ Marcar "⏰ Documentos Próximos a Vencer"

4. Hacer clic en "Enviar Notificaciones Ahora"

5. El sistema enviará:
   - ${correosExpirados} correos sobre documentos vencidos
   - ${correosProximos} correos sobre documentos próximos

6. Verificar:
   - Bandeja de entrada de los usuarios
   - Logs en "Historial de Envíos"
   - Base de datos: SELECT * FROM notificaciones_log ORDER BY fecha_envio DESC LIMIT 10;
    `);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testApiNotifications();
