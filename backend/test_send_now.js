require('dotenv').config();
const mysql = require('mysql2/promise');

async function testSendNotificationsNow() {
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
      ejecutarNotificacionesManual
    } = require('./src/services/notificationService');

    // Obtener documentos expirados
    const docsExpirados = await obtenerDocumentosExpirados();
    const docsProximos = await obtenerDocumentosProximosAExpirar();

    console.log('📊 ESTADO ACTUAL');
    console.log('═'.repeat(60));
    console.log(`Documentos expirados encontrados: ${docsExpirados.length}`);
    console.log(`Documentos próximos a expirar: ${docsProximos.length}\n`);

    if (docsExpirados.length === 0 && docsProximos.length === 0) {
      console.log('⚠️  No hay documentos para notificar.');
      await connection.end();
      process.exit(0);
    }

    // Obtener configuración actual
    const [config] = await connection.query(
      'SELECT activo, notificaciones_email_activas FROM notificaciones_config WHERE id = 1'
    );

    console.log('⚙️  CONFIGURACIÓN ACTUAL');
    console.log('═'.repeat(60));
    console.log(`Sistema activo: ${config[0].activo ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Notificaciones por email activas: ${config[0].notificaciones_email_activas ? '✅ SÍ' : '❌ NO'}`);
    console.log(`SMTP configurado: ${process.env.SMTP_HOST ? '✅ SÍ' : '❌ NO'}\n`);

    if (!config[0].activo || !config[0].notificaciones_email_activas) {
      console.error('❌ Las notificaciones no están habilitadas. Abórtando.');
      await connection.end();
      process.exit(1);
    }

    // Ejecutar notificaciones
    console.log('📤 EJECUTANDO ENVÍO DE NOTIFICACIONES');
    console.log('═'.repeat(60));

    const resultado = await ejecutarNotificacionesManual({
      documentosExpirados: docsExpirados.length > 0,
      documentosProximos: docsProximos.length > 0
    });

    console.log('\n📊 RESULTADO DEL ENVÍO');
    console.log('═'.repeat(60));
    console.log(`Correos enviados: ${resultado.correos_enviados}`);
    console.log(`Mensaje: ${resultado.mensaje}`);

    // Verificar el log de notificaciones
    console.log('\n📋 ÚLTIMAS ENTRADAS EN EL LOG');
    console.log('═'.repeat(60));

    const [log] = await connection.query(`
      SELECT tipo, cantidad_correos, fecha_envio, estado
      FROM notificaciones_log
      ORDER BY fecha_envio DESC
      LIMIT 5
    `);

    if (log.length === 0) {
      console.log('  No hay entradas en el log');
    } else {
      log.forEach((entry, idx) => {
        const fecha = new Date(entry.fecha_envio).toLocaleString('es-ES');
        console.log(`${idx + 1}. [${entry.estado.toUpperCase()}] ${entry.tipo} - ${entry.cantidad_correos || 0} correos - ${fecha}`);
      });
    }

    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('═'.repeat(60));
    console.log('Revisa:');
    console.log('  1. La bandeja de entrada de los usuarios');
    console.log('  2. Los logs en http://localhost:5175/admin/notificaciones');
    console.log('  3. La tabla notificaciones_log en la base de datos');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testSendNotificationsNow();
