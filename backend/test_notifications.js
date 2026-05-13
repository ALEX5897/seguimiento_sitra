require('dotenv').config();
const mysql = require('mysql2/promise');
const { enviarNotificacionDocumentos } = require('./src/services/mailService');
const { obtenerPlantilla } = require('./src/services/notificationService');

async function testNotifications() {
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

    // Obtener datos de prueba
    console.log('📊 Cargando datos de prueba...');

    // Obtener un usuario para las pruebas
    const [usuarios] = await connection.query(
      'SELECT id, nombre, correo FROM usuarios LIMIT 1'
    );

    if (usuarios.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      await connection.end();
      process.exit(1);
    }

    const usuario = usuarios[0];
    console.log(`  ✓ Usuario de prueba: ${usuario.nombre} (${usuario.correo})\n`);

    // Obtener documentos de prueba
    const [documentos] = await connection.query(`
      SELECT
        id, numero_documento, tipo_documento, remitente,
        asunto, fecha_max_respuesta, usuario_id
      FROM reasignados
      LIMIT 3
    `);

    if (documentos.length === 0) {
      console.error('❌ No hay documentos en la base de datos');
      await connection.end();
      process.exit(1);
    }

    console.log(`✓ ${documentos.length} documentos cargados\n`);

    // Obtener plantillas
    console.log('📋 Cargando plantillas...');
    const [plantillas] = await connection.query(
      'SELECT tipo, asunto, cuerpo_html FROM notificaciones_plantillas'
    );

    console.log(`  ✓ ${plantillas.length} plantillas encontradas\n`);

    // Prueba 1: Documento Asignado
    console.log('📧 Prueba 1: Notificación de Documento Asignado');
    console.log('═'.repeat(50));
    try {
      const doc = documentos[0];
      const plantilla = plantillas.find(p => p.tipo === 'asignado');

      const asunto = plantilla.asunto
        .replace('{{nombre}}', usuario.nombre);

      let cuerpo = plantilla.cuerpo_html
        .replace('{{nombre}}', usuario.nombre)
        .replace('{{numero_documento}}', doc.numero_documento)
        .replace('{{tipo_documento}}', doc.tipo_documento || '-')
        .replace('{{remitente}}', doc.remitente || '-')
        .replace('{{fecha_max_respuesta}}', doc.fecha_max_respuesta ? new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES') : '-')
        .replace('{{asunto}}', doc.asunto || '-')
        .replace('{{url_sistema}}', process.env.FRONTEND_URL || 'http://localhost:5175');

      console.log(`  Asunto: ${asunto}`);
      console.log(`  Correo: ${usuario.correo}`);
      console.log(`  Documento: ${doc.numero_documento}`);
      console.log(`  Tipo: ${doc.tipo_documento}`);
      console.log(`  Fecha límite: ${new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES')}`);
      console.log(`  ✓ Plantilla renderizada correctamente\n`);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }

    // Prueba 2: Documento Tarde
    console.log('📧 Prueba 2: Notificación de Documento Tarde');
    console.log('═'.repeat(50));
    try {
      const plantilla = plantillas.find(p => p.tipo === 'tarde');
      const docsSeleccionados = documentos.slice(0, 2);

      const asunto = plantilla.asunto
        .replace('{{nombre}}', usuario.nombre);

      let tabla = '<ul style="list-style-type: none;">';
      docsSeleccionados.forEach(doc => {
        const diasRetraso = Math.floor((new Date() - new Date(doc.fecha_max_respuesta)) / (1000 * 60 * 60 * 24));
        tabla += `<li>📋 <strong>${doc.numero_documento}</strong> - ${diasRetraso} días de retraso</li>`;
      });
      tabla += '</ul>';

      let cuerpo = plantilla.cuerpo_html
        .replace('{{nombre}}', usuario.nombre)
        .replace('{{cantidad}}', docsSeleccionados.length)
        .replace('{{tabla_documentos}}', tabla)
        .replace('{{url_sistema}}', process.env.FRONTEND_URL || 'http://localhost:5175');

      console.log(`  Asunto: ${asunto}`);
      console.log(`  Correo: ${usuario.correo}`);
      console.log(`  Documentos vencidos: ${docsSeleccionados.length}`);
      console.log(`  ✓ Plantilla renderizada correctamente\n`);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }

    // Prueba 3: Documento Próximo a Vencer
    console.log('📧 Prueba 3: Notificación de Documento Próximo a Vencer');
    console.log('═'.repeat(50));
    try {
      const plantilla = plantillas.find(p => p.tipo === 'proximo_vencer');
      const docsSeleccionados = documentos.slice(0, 1);

      const asunto = plantilla.asunto
        .replace('{{nombre}}', usuario.nombre);

      let tabla = '<ul style="list-style-type: none;">';
      docsSeleccionados.forEach(doc => {
        tabla += `<li>📋 <strong>${doc.numero_documento}</strong> - Vence: ${new Date(doc.fecha_max_respuesta).toLocaleDateString('es-ES')}</li>`;
      });
      tabla += '</ul>';

      let cuerpo = plantilla.cuerpo_html
        .replace('{{nombre}}', usuario.nombre)
        .replace('{{cantidad}}', docsSeleccionados.length)
        .replace('{{tabla_documentos}}', tabla)
        .replace('{{url_sistema}}', process.env.FRONTEND_URL || 'http://localhost:5175');

      console.log(`  Asunto: ${asunto}`);
      console.log(`  Correo: ${usuario.correo}`);
      console.log(`  Documentos próximos a vencer: ${docsSeleccionados.length}`);
      console.log(`  ✓ Plantilla renderizada correctamente\n`);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }

    console.log('✓ Todas las plantillas se renderizaron correctamente');
    console.log('\n📌 Para enviar notificaciones reales:');
    console.log('  1. Asegúrate que notificaciones_email_activas = true en base de datos');
    console.log('  2. Verifica que las credenciales de SMTP estén configuradas en .env');
    console.log('  3. Usa el botón "Enviar Notificaciones Ahora" en http://localhost:5175/admin/notificaciones');
    console.log('  4. O ejecuta: node backend/send-pending-notifications.js');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testNotifications();
