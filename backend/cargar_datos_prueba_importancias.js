require('dotenv').config();
const mysql = require('mysql2/promise');

async function cargarDatos() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado');
    console.log('🔄 Insertando datos de prueba...');

    // Obtener un usuario para asignar los documentos
    const [usuarios] = await connection.query(
      'SELECT id, nombre FROM empleados LIMIT 1'
    );

    if (!usuarios.length) {
      console.error('❌ No hay usuarios en la base de datos. Por favor crea usuarios primero.');
      await connection.end();
      process.exit(1);
    }

    const usuario = usuarios[0];
    console.log(`✓ Usando usuario: ${usuario.nombre}`);

    // Datos de prueba
    const datos = [
      {
        numero_documento: 'DOC-TEST-001',
        tipo_documento: 'Memorando',
        importancia: 'Media',
        numero_tramite: 'TRAM-TEST-001',
        fecha_documento: new Date(),
        fecha_reasignacion: new Date(),
        fecha_max_respuesta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento de prueba con importancia Media (Normal)',
        remitente: 'Departamento A',
        destinatario: 'Departamento B',
        asunto: 'Prueba de importancia Media',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-TEST-002',
        tipo_documento: 'Oficio',
        importancia: 'Media',
        numero_tramite: 'TRAM-TEST-002',
        fecha_documento: new Date(),
        fecha_reasignacion: new Date(),
        fecha_max_respuesta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento de prueba con importancia Media',
        remitente: 'Dirección General',
        destinatario: 'Unidad de Atención',
        asunto: 'Seguimiento de proceso',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-TEST-003',
        tipo_documento: 'Circular',
        importancia: 'Alta',
        numero_tramite: 'TRAM-TEST-003',
        fecha_documento: new Date(),
        fecha_reasignacion: new Date(),
        fecha_max_respuesta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento de prueba con importancia Alta - requiere atención urgente',
        remitente: 'Dirección Ejecutiva',
        destinatario: 'Todos los departamentos',
        asunto: 'Comunicado urgente sobre cambios normativa',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-TEST-004',
        tipo_documento: 'Oficio',
        importancia: 'Alta',
        numero_tramite: 'TRAM-TEST-004',
        fecha_documento: new Date(),
        fecha_reasignacion: new Date(),
        fecha_max_respuesta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento de prueba con importancia Alta',
        remitente: 'Presidencia',
        destinatario: 'Administración',
        asunto: 'Resolución administrativa importante',
        estado: 'pendiente'
      }
    ];

    for (const doc of datos) {
      try {
        await connection.query(
          'INSERT INTO reasignados (numero_documento, tipo_documento, importancia, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, usuario_id, comentario, remitente, destinatario, asunto, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            doc.numero_documento,
            doc.tipo_documento,
            doc.importancia,
            doc.numero_tramite,
            doc.fecha_documento,
            doc.fecha_reasignacion,
            doc.fecha_max_respuesta,
            doc.reasignado_a,
            doc.usuario_id,
            doc.comentario,
            doc.remitente,
            doc.destinatario,
            doc.asunto,
            doc.estado
          ]
        );
        console.log(`✓ ${doc.numero_documento} (${doc.importancia}) insertado`);
      } catch (err) {
        console.error(`❌ Error insertando ${doc.numero_documento}:`, err.message);
      }
    }

    console.log('✓ Datos de prueba cargados correctamente');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

cargarDatos();
