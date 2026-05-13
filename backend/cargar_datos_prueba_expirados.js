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
    console.log('🔄 Insertando datos de prueba de documentos expirados...');

    // Obtener usuario
    const [usuarios] = await connection.query(
      'SELECT id, nombre FROM empleados LIMIT 1'
    );

    if (!usuarios.length) {
      console.error('❌ No hay usuarios en la base de datos.');
      await connection.end();
      process.exit(1);
    }

    const usuario = usuarios[0];

    // Calcular fechas
    const hoy = new Date();
    const hace92Dias = new Date(hoy.getTime() - 92 * 24 * 60 * 60 * 1000);
    const hace90Dias = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
    const hace87Dias = new Date(hoy.getTime() - 87 * 24 * 60 * 60 * 1000);
    const hace86Dias = new Date(hoy.getTime() - 86 * 24 * 60 * 60 * 1000);
    const hace33Dias = new Date(hoy.getTime() - 33 * 24 * 60 * 60 * 1000);
    const hace32Dias = new Date(hoy.getTime() - 32 * 24 * 60 * 60 * 1000);
    const hace22Dias = new Date(hoy.getTime() - 22 * 24 * 60 * 60 * 1000);
    const hace21Dias = new Date(hoy.getTime() - 21 * 24 * 60 * 60 * 1000);
    const hace4Dias = new Date(hoy.getTime() - 4 * 24 * 60 * 60 * 1000);
    const hace3Dias = new Date(hoy.getTime() - 3 * 24 * 60 * 60 * 1000);
    const hoy0 = new Date(hoy.getTime()); // 0 días
    const mañana = new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000);

    const datos = [
      {
        numero_documento: 'DOC-PEND-VENC-001',
        tipo_documento: 'Memorando',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-001',
        fecha_documento: hace92Dias,
        fecha_reasignacion: hace92Dias,
        fecha_max_respuesta: hace92Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento vencido hace 92 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Pendiente vencido',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-PEND-VENC-002',
        tipo_documento: 'Oficio',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-002',
        fecha_documento: hace90Dias,
        fecha_reasignacion: hace90Dias,
        fecha_max_respuesta: hace90Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento vencido hace 90 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Pendiente vencido',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-PROC-VENC-001',
        tipo_documento: 'Circular',
        importancia: 'Media',
        numero_tramite: 'TRAM-EXP-003',
        fecha_documento: hace87Dias,
        fecha_reasignacion: hace87Dias,
        fecha_max_respuesta: hace87Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento en proceso vencido hace 87 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'En proceso vencido',
        estado: 'en_proceso'
      },
      {
        numero_documento: 'DOC-PROC-VENC-002',
        tipo_documento: 'Memorando',
        importancia: 'Media',
        numero_tramite: 'TRAM-EXP-004',
        fecha_documento: hace86Dias,
        fecha_reasignacion: hace86Dias,
        fecha_max_respuesta: hace86Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento en proceso vencido hace 86 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'En proceso vencido',
        estado: 'en_proceso'
      },
      {
        numero_documento: 'DOC-ARCH-001',
        tipo_documento: 'Oficio',
        importancia: 'Baja',
        numero_tramite: 'TRAM-EXP-005',
        fecha_documento: hace33Dias,
        fecha_reasignacion: hace33Dias,
        fecha_max_respuesta: hace33Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento archivado vencido hace 33 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Archivado vencido',
        estado: 'archivado'
      },
      {
        numero_documento: 'DOC-ARCH-002',
        tipo_documento: 'Circular',
        importancia: 'Baja',
        numero_tramite: 'TRAM-EXP-006',
        fecha_documento: hace32Dias,
        fecha_reasignacion: hace32Dias,
        fecha_max_respuesta: hace32Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento archivado vencido hace 32 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Archivado vencido',
        estado: 'archivado'
      },
      {
        numero_documento: 'DOC-CANC-001',
        tipo_documento: 'Memorando',
        importancia: 'Baja',
        numero_tramite: 'TRAM-EXP-007',
        fecha_documento: hace22Dias,
        fecha_reasignacion: hace22Dias,
        fecha_max_respuesta: hace22Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento cancelado vencido hace 22 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Cancelado vencido',
        estado: 'cancelado'
      },
      {
        numero_documento: 'DOC-CANC-002',
        tipo_documento: 'Oficio',
        importancia: 'Baja',
        numero_tramite: 'TRAM-EXP-008',
        fecha_documento: hace21Dias,
        fecha_reasignacion: hace21Dias,
        fecha_max_respuesta: hace21Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento cancelado vencido hace 21 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Cancelado vencido',
        estado: 'cancelado'
      },
      {
        numero_documento: 'DOC-RESUELTO-001',
        tipo_documento: 'Circular',
        importancia: 'Media',
        numero_tramite: 'TRAM-EXP-009',
        fecha_documento: hace4Dias,
        fecha_reasignacion: hace4Dias,
        fecha_max_respuesta: hace4Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento resuelto vencido hace 4 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Resuelto vencido',
        estado: 'resuelto'
      },
      {
        numero_documento: 'DOC-RESUELTO-002',
        tipo_documento: 'Memorando',
        importancia: 'Media',
        numero_tramite: 'TRAM-EXP-010',
        fecha_documento: hace3Dias,
        fecha_reasignacion: hace3Dias,
        fecha_max_respuesta: hace3Dias,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento resuelto vencido hace 3 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Resuelto vencido',
        estado: 'resuelto'
      },
      {
        numero_documento: 'DOC-PROC-PROX-002',
        tipo_documento: 'Oficio',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-011',
        fecha_documento: hoy0,
        fecha_reasignacion: hoy0,
        fecha_max_respuesta: hoy0,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento en proceso próximo a expirar - 0 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'En proceso próximo a vencer',
        estado: 'en_proceso'
      },
      {
        numero_documento: 'DOC-PROC-PROX-001',
        tipo_documento: 'Circular',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-012',
        fecha_documento: mañana,
        fecha_reasignacion: mañana,
        fecha_max_respuesta: mañana,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento en proceso próximo a expirar - mañana',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'En proceso próximo a vencer',
        estado: 'en_proceso'
      },
      {
        numero_documento: 'DOC-PEND-PROX-002',
        tipo_documento: 'Memorando',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-013',
        fecha_documento: hoy0,
        fecha_reasignacion: hoy0,
        fecha_max_respuesta: hoy0,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento pendiente próximo a expirar - 0 días',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Pendiente próximo a vencer',
        estado: 'pendiente'
      },
      {
        numero_documento: 'DOC-PEND-PROX-001',
        tipo_documento: 'Oficio',
        importancia: 'Alta',
        numero_tramite: 'TRAM-EXP-014',
        fecha_documento: mañana,
        fecha_reasignacion: mañana,
        fecha_max_respuesta: mañana,
        reasignado_a: usuario.nombre,
        usuario_id: usuario.id,
        comentario: 'Documento pendiente próximo a expirar - mañana',
        remitente: 'Dirección',
        destinatario: 'Departamento',
        asunto: 'Pendiente próximo a vencer',
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
        console.log(`✓ ${doc.numero_documento} (${doc.estado}) insertado`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ ${doc.numero_documento} ya existe`);
        } else {
          console.error(`❌ Error insertando ${doc.numero_documento}:`, err.message);
        }
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
