require('dotenv').config();
const mysql = require('mysql2/promise');

async function testSendNotifications() {
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

    // Verificar configuración
    console.log('📋 Verificando configuración de notificaciones...');
    const [config] = await connection.query(
      'SELECT * FROM notificaciones_config WHERE id = 1'
    );

    if (config.length === 0) {
      console.error('❌ Configuración no encontrada');
      await connection.end();
      process.exit(1);
    }

    const cfg = config[0];
    console.log(`  ✓ Sistema activo: ${cfg.activo ? 'SÍ' : 'NO'}`);
    console.log(`  ✓ Email activo: ${cfg.notificaciones_email_activas ? 'SÍ' : 'NO'}`);
    console.log(`  ✓ Hora de envío: ${cfg.hora_envio}`);
    console.log(`  ✓ Días de retraso: ${cfg.dias_retraso}\n`);

    if (!cfg.activo || !cfg.notificaciones_email_activas) {
      console.error('❌ Las notificaciones no están habilitadas');
      await connection.end();
      process.exit(1);
    }

    // Obtener documentos expirados
    console.log('📊 Buscando documentos expirados...');
    const [expirados] = await connection.query(`
      SELECT
        id, numero_documento, tipo_documento, remitente,
        asunto, fecha_max_respuesta, usuario_id, reasignado_a,
        estado, correo_enviado_expiracion
      FROM reasignados
      WHERE DATE(fecha_max_respuesta) <= DATE(DATE_SUB(NOW(), INTERVAL ? DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
      ORDER BY fecha_max_respuesta ASC
      LIMIT 5
    `, [cfg.dias_retraso]);

    console.log(`  ✓ Documentos expirados encontrados: ${expirados.length}`);
    if (expirados.length > 0) {
      expirados.forEach((doc, idx) => {
        const diasRetraso = Math.floor((new Date() - new Date(doc.fecha_max_respuesta)) / (1000 * 60 * 60 * 24));
        console.log(`    ${idx + 1}. ${doc.numero_documento} - ${diasRetraso} días de retraso`);
      });
    }
    console.log();

    // Obtener documentos próximos a vencer
    console.log('📊 Buscando documentos próximos a vencer...');
    const [proximos] = await connection.query(`
      SELECT
        id, numero_documento, tipo_documento, remitente,
        asunto, fecha_max_respuesta, usuario_id, reasignado_a,
        estado, correo_enviado_un_dia_antes
      FROM reasignados
      WHERE DATE(fecha_max_respuesta) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
      ORDER BY fecha_max_respuesta ASC
      LIMIT 5
    `);

    console.log(`  ✓ Documentos próximos a vencer: ${proximos.length}`);
    if (proximos.length > 0) {
      proximos.forEach((doc, idx) => {
        console.log(`    ${idx + 1}. ${doc.numero_documento} - Vence: ${new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES')}`);
      });
    }
    console.log();

    // Simular el envío de notificaciones
    console.log('📤 Simulando envío de notificaciones...');
    console.log('═'.repeat(50));

    // Obtener usuarios para documentos expirados
    if (expirados.length > 0) {
      console.log('\n🔔 NOTIFICACIONES DE DOCUMENTOS EXPIRADOS');
      console.log('─'.repeat(50));

      const usuariosExpirадос = {};
      for (const doc of expirados) {
        const userId = doc.usuario_id;
        if (!usuariosExpirадос[userId]) {
          const [usuario] = await connection.query(
            'SELECT id, nombre, correo FROM usuarios WHERE id = ?',
            [userId]
          );
          if (usuario.length > 0) {
            usuariosExpirадос[userId] = usuario[0];
          }
        }
      }

      for (const [userId, usuario] of Object.entries(usuariosExpirадос)) {
        const docsDelUsuario = expirados.filter(d => d.usuario_id == userId);
        console.log(`\n📧 Correo para: ${usuario.nombre} (${usuario.correo})`);
        console.log(`   Asunto: SITRA: Documento(s) con retraso - ACCIÓN URGENTE`);
        console.log(`   Documentos: ${docsDelUsuario.length}`);
        docsDelUsuario.forEach(doc => {
          const diasRetraso = Math.floor((new Date() - new Date(doc.fecha_max_respuesta)) / (1000 * 60 * 60 * 24));
          console.log(`     • ${doc.numero_documento} - ${diasRetraso} días tarde`);
        });
        console.log(`   ✓ Listo para enviar`);
      }
    }

    // Obtener usuarios para documentos próximos
    if (proximos.length > 0) {
      console.log('\n\n🔔 NOTIFICACIONES DE DOCUMENTOS PRÓXIMOS A VENCER');
      console.log('─'.repeat(50));

      const usuariosProximos = {};
      for (const doc of proximos) {
        const userId = doc.usuario_id;
        if (!usuariosProximos[userId]) {
          const [usuario] = await connection.query(
            'SELECT id, nombre, correo FROM usuarios WHERE id = ?',
            [userId]
          );
          if (usuario.length > 0) {
            usuariosProximos[userId] = usuario[0];
          }
        }
      }

      for (const [userId, usuario] of Object.entries(usuariosProximos)) {
        const docsDelUsuario = proximos.filter(d => d.usuario_id == userId);
        console.log(`\n📧 Correo para: ${usuario.nombre} (${usuario.correo})`);
        console.log(`   Asunto: SITRA: Documento(s) próximo a vencer - Acción requerida en 24 horas`);
        console.log(`   Documentos: ${docsDelUsuario.length}`);
        docsDelUsuario.forEach(doc => {
          console.log(`     • ${doc.numero_documento} - Vence: ${new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES')}`);
        });
        console.log(`   ✓ Listo para enviar`);
      }
    }

    // Mostrar log de notificaciones recientes
    console.log('\n\n📋 Últimas notificaciones enviadas (últimas 10):');
    console.log('═'.repeat(50));
    const [log] = await connection.query(`
      SELECT tipo, usuario_id, email_destino, cantidad_correos, fecha_envio, estado
      FROM notificaciones_log
      ORDER BY fecha_envio DESC
      LIMIT 10
    `);

    if (log.length === 0) {
      console.log('  ℹ️  Sin notificaciones registradas aún');
    } else {
      console.log(
        `${'Tipo'.padEnd(20)} | ${'Usuario ID'.padEnd(10)} | ${'Correos'.padEnd(8)} | ${'Estado'.padEnd(8)} | Fecha`
      );
      console.log('─'.repeat(80));
      log.forEach(entry => {
        const tipo = (entry.tipo).padEnd(20);
        const userId = (entry.usuario_id || '-').toString().padEnd(10);
        const correos = (entry.cantidad_correos || 1).toString().padEnd(8);
        const estado = entry.estado.padEnd(8);
        const fecha = new Date(entry.fecha_envio).toLocaleString('es-ES');
        console.log(`${tipo} | ${userId} | ${correos} | ${estado} | ${fecha}`);
      });
    }

    console.log('\n\n✅ CONCLUSIONES:');
    console.log('═'.repeat(50));
    console.log(`
Documentos que se notificarían:
  ✓ ${expirados.length} documentos expirados (serán notificados)
  ✓ ${proximos.length} documentos próximos a vencer (serán notificados)

Configuración:
  ✓ Sistema de notificaciones: ${cfg.activo ? '✅ ACTIVO' : '❌ INACTIVO'}
  ✓ Notificaciones por correo: ${cfg.notificaciones_email_activas ? '✅ ACTIVAS' : '❌ INACTIVAS'}
  ✓ SMTP configurado en .env: ${process.env.SMTP_HOST ? '✅ SÍ' : '❌ NO'}

Para probar manualmente:
  1. Ir a: http://localhost:5175/admin/notificaciones
  2. En "Enviar Notificaciones Ahora":
     - Marcar "📋 Documentos Tarde (Expirados)" ${expirados.length > 0 ? '✅' : '⚠️'}
     - Marcar "⏰ Documentos Próximos a Vencer" ${proximos.length > 0 ? '✅' : '⚠️'}
  3. Hacer clic en "Enviar Notificaciones Ahora"
  4. Los correos se enviarán a los usuarios correspondientes
    `);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testSendNotifications();
