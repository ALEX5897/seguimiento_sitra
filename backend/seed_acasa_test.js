const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function seedTestData() {
  const host = process.env.DB_HOST || '172.16.1.63';
  const user = process.env.DB_USER || 'us_segdoc';
  const password = process.env.DB_PASS || '@2BKb+0sJX!5';
  const database = process.env.DB_NAME || 'seguimiento_sitra';

  console.log('📊 Seed de datos de prueba - Usuario ACASA\n');
  console.log('Conectando a BD:', { host, user, database });

  const conn = await mysql.createConnection({ host, user, password, database, multipleStatements: true });

  try {
    // 1. Obtener usuario_id para acasa@quito-turismo.gob.ec
    console.log('\n🔍 Buscando usuario acasa@quito-turismo.gob.ec...');
    const [usuarioRows] = await conn.query(
      'SELECT id, nombre, correo FROM empleados WHERE correo = ? LIMIT 1',
      ['acasa@quito-turismo.gob.ec']
    );

    if (!usuarioRows.length) {
      console.error('❌ Error: No se encontró usuario con correo acasa@quito-turismo.gob.ec');
      process.exit(1);
    }

    const usuarioId = usuarioRows[0].id;
    const usuarioNombre = usuarioRows[0].nombre;
    console.log(`✓ Usuario encontrado: ${usuarioNombre} (ID: ${usuarioId})`);

    // 2. Desactivar FK constraints
    console.log('\n⚙️  Desactivando constraints...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✓ FK constraints desactivadas');

    // 3. Limpiar tablas
    console.log('\n🧹 Limpiando tablas...');
    await conn.query('TRUNCATE TABLE reasignados');
    console.log('✓ TRUNCATE TABLE reasignados');
    await conn.query('TRUNCATE TABLE enviados');
    console.log('✓ TRUNCATE TABLE enviados');
    await conn.query('TRUNCATE TABLE tareas');
    console.log('✓ TRUNCATE TABLE tareas');

    // 4. Reactivar FK constraints
    console.log('\n⚙️  Reactivando constraints...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ FK constraints reactivadas');

    // 5. Insertar datos de prueba solo en REASIGNADOS (2 de cada caso)
    console.log('\n📄 Insertando datos de prueba en REASIGNADOS (2 de cada caso)...\n');

    const testData = [
      // CASO 1: Pendiente - VENCIDO (hace días)
      {
        numero_documento: 'DOC-PEND-VENC-001',
        tipo_documento: 'Memorando',
        numero_tramite: 'TR-001',
        fecha_documento: '2026-02-01',
        fecha_reasignacion: '2026-02-05',
        fecha_max_respuesta: '2026-02-10',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'alta',
        remitente: 'Dirección General',
        destinatario: 'RRHH',
        asunto: 'Aprobación de presupuesto vencida'
      },
      {
        numero_documento: 'DOC-PEND-VENC-002',
        tipo_documento: 'Oficio',
        numero_tramite: 'TR-002',
        fecha_documento: '2026-02-02',
        fecha_reasignacion: '2026-02-08',
        fecha_max_respuesta: '2026-02-12',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'alta',
        remitente: 'Finanzas',
        destinatario: 'Operaciones',
        asunto: 'Solicitud de fondos vencida'
      },

      // CASO 2: Pendiente - PRÓXIMO A VENCER (menos de 24 horas)
      {
        numero_documento: 'DOC-PEND-PROX-001',
        tipo_documento: 'Acuerdo',
        numero_tramite: 'TR-003',
        fecha_documento: '2026-05-10',
        fecha_reasignacion: '2026-05-10',
        fecha_max_respuesta: '2026-05-12 18:00:00',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'media',
        remitente: 'Juridico',
        destinatario: 'Operaciones',
        asunto: 'Acuerdo comercial próximo a vencer'
      },
      {
        numero_documento: 'DOC-PEND-PROX-002',
        tipo_documento: 'Resolución',
        numero_tramite: 'TR-004',
        fecha_documento: '2026-05-09',
        fecha_reasignacion: '2026-05-09',
        fecha_max_respuesta: '2026-05-12 20:00:00',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'media',
        remitente: 'TI',
        destinatario: 'Ventas',
        asunto: 'Resolución próxima a vencer'
      },

      // CASO 3: Pendiente - SIN VENCER (plazo aún disponible)
      {
        numero_documento: 'DOC-PEND-OK-001',
        tipo_documento: 'Contrato',
        numero_tramite: 'TR-005',
        fecha_documento: '2026-05-11',
        fecha_reasignacion: '2026-05-11',
        fecha_max_respuesta: '2026-05-20',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'baja',
        remitente: 'Logística',
        destinatario: 'TI',
        asunto: 'Contrato sin vencer'
      },
      {
        numero_documento: 'DOC-PEND-OK-002',
        tipo_documento: 'Memorando',
        numero_tramite: 'TR-006',
        fecha_documento: '2026-05-11',
        fecha_reasignacion: '2026-05-11',
        fecha_max_respuesta: '2026-05-18',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'pendiente',
        importancia: 'baja',
        remitente: 'Administración',
        destinatario: 'Finanzas',
        asunto: 'Memorando con plazo disponible'
      },

      // CASO 4: En proceso - VENCIDO
      {
        numero_documento: 'DOC-PROC-VENC-001',
        tipo_documento: 'Acuerdo',
        numero_tramite: 'TR-007',
        fecha_documento: '2026-02-03',
        fecha_reasignacion: '2026-02-07',
        fecha_max_respuesta: '2026-02-15',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'alta',
        remitente: 'Compliance',
        destinatario: 'RRHH',
        asunto: 'Acuerdo en proceso vencido',
        comentario: '50% completado'
      },
      {
        numero_documento: 'DOC-PROC-VENC-002',
        tipo_documento: 'Oficio',
        numero_tramite: 'TR-008',
        fecha_documento: '2026-02-04',
        fecha_reasignacion: '2026-02-10',
        fecha_max_respuesta: '2026-02-16',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'media',
        remitente: 'Ventas',
        destinatario: 'Marketing',
        asunto: 'Oficio en proceso vencido',
        comentario: '40% completado'
      },

      // CASO 5: En proceso - PRÓXIMO A VENCER
      {
        numero_documento: 'DOC-PROC-PROX-001',
        tipo_documento: 'Reporte',
        numero_tramite: 'TR-009',
        fecha_documento: '2026-05-10',
        fecha_reasignacion: '2026-05-10',
        fecha_max_respuesta: '2026-05-12 14:00:00',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'alta',
        remitente: 'Finanzas',
        destinatario: 'Operaciones',
        asunto: 'Reporte en proceso próximo a vencer',
        comentario: '70% completado'
      },
      {
        numero_documento: 'DOC-PROC-PROX-002',
        tipo_documento: 'Memorando',
        numero_tramite: 'TR-010',
        fecha_documento: '2026-05-10',
        fecha_reasignacion: '2026-05-10',
        fecha_max_respuesta: '2026-05-12 16:00:00',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'media',
        remitente: 'TI',
        destinatario: 'Compliance',
        asunto: 'Memorando en proceso próximo a vencer',
        comentario: '60% completado'
      },

      // CASO 6: En proceso - SIN VENCER
      {
        numero_documento: 'DOC-PROC-OK-001',
        tipo_documento: 'Contrato',
        numero_tramite: 'TR-011',
        fecha_documento: '2026-05-11',
        fecha_reasignacion: '2026-05-11',
        fecha_max_respuesta: '2026-05-19',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'media',
        remitente: 'Juridico',
        destinatario: 'Logística',
        asunto: 'Contrato en proceso',
        comentario: '30% completado'
      },
      {
        numero_documento: 'DOC-PROC-OK-002',
        tipo_documento: 'Acuerdo',
        numero_tramite: 'TR-012',
        fecha_documento: '2026-05-11',
        fecha_reasignacion: '2026-05-11',
        fecha_max_respuesta: '2026-05-21',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'en_proceso',
        importancia: 'baja',
        remitente: 'Administración',
        destinatario: 'Ventas',
        asunto: 'Acuerdo en proceso',
        comentario: '50% completado'
      },

      // CASO 7: RESUELTO
      {
        numero_documento: 'DOC-RESUELTO-001',
        tipo_documento: 'Memorando',
        numero_tramite: 'TR-013',
        fecha_documento: '2026-05-05',
        fecha_reasignacion: '2026-05-05',
        fecha_max_respuesta: '2026-05-09',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'resuelto',
        importancia: 'alta',
        remitente: 'Dirección',
        destinatario: 'RRHH',
        asunto: 'Documento resuelto exitosamente',
        respuesta: 'Completado y entregado'
      },
      {
        numero_documento: 'DOC-RESUELTO-002',
        tipo_documento: 'Oficio',
        numero_tramite: 'TR-014',
        fecha_documento: '2026-05-06',
        fecha_reasignacion: '2026-05-06',
        fecha_max_respuesta: '2026-05-10',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'resuelto',
        importancia: 'media',
        remitente: 'Finanzas',
        destinatario: 'Operaciones',
        asunto: 'Oficio resuelto',
        respuesta: 'Procesado correctamente'
      },

      // CASO 8: ARCHIVADO
      {
        numero_documento: 'DOC-ARCH-001',
        tipo_documento: 'Contrato',
        numero_tramite: 'TR-015',
        fecha_documento: '2026-04-01',
        fecha_reasignacion: '2026-04-01',
        fecha_max_respuesta: '2026-04-10',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'archivado',
        importancia: 'baja',
        remitente: 'Juridico',
        destinatario: 'Operaciones',
        asunto: 'Documento archivado'
      },
      {
        numero_documento: 'DOC-ARCH-002',
        tipo_documento: 'Acuerdo',
        numero_tramite: 'TR-016',
        fecha_documento: '2026-04-02',
        fecha_reasignacion: '2026-04-02',
        fecha_max_respuesta: '2026-04-11',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'archivado',
        importancia: 'baja',
        remitente: 'Compliance',
        destinatario: 'Ventas',
        asunto: 'Acuerdo archivado'
      },

      // CASO 9: CANCELADO
      {
        numero_documento: 'DOC-CANC-001',
        tipo_documento: 'Memorando',
        numero_tramite: 'TR-017',
        fecha_documento: '2026-04-15',
        fecha_reasignacion: '2026-04-15',
        fecha_max_respuesta: '2026-04-20',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'cancelado',
        importancia: 'media',
        remitente: 'TI',
        destinatario: 'Logística',
        asunto: 'Documento cancelado',
        comentario: 'Solicitud retractada'
      },
      {
        numero_documento: 'DOC-CANC-002',
        tipo_documento: 'Reporte',
        numero_tramite: 'TR-018',
        fecha_documento: '2026-04-16',
        fecha_reasignacion: '2026-04-16',
        fecha_max_respuesta: '2026-04-21',
        reasignado_a: usuarioNombre,
        usuario_id: usuarioId,
        estado: 'cancelado',
        importancia: 'baja',
        remitente: 'Marketing',
        destinatario: 'Ventas',
        asunto: 'Reporte cancelado',
        comentario: 'Solicitud eliminada'
      }
    ];

    // Insertar cada registro
    for (const doc of testData) {
      const query = `
        INSERT INTO reasignados
        (numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion,
         fecha_max_respuesta, reasignado_a, usuario_id, estado, importancia, remitente,
         destinatario, asunto, comentario, respuesta, extra)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await conn.query(query, [
        doc.numero_documento,
        doc.tipo_documento,
        doc.numero_tramite,
        doc.fecha_documento,
        doc.fecha_reasignacion,
        doc.fecha_max_respuesta,
        doc.reasignado_a,
        doc.usuario_id,
        doc.estado,
        doc.importancia || 'media',
        doc.remitente,
        doc.destinatario,
        doc.asunto,
        doc.comentario || null,
        doc.respuesta || null,
        JSON.stringify({})
      ]);

      console.log(`  ✓ ${doc.numero_documento} (${doc.estado})`);
    }

    // Mostrar resumen
    console.log('\n📊 Resumen de datos cargados:');
    const [reasignados] = await conn.query('SELECT COUNT(*) as total FROM reasignados');
    const [enviados] = await conn.query('SELECT COUNT(*) as total FROM enviados');
    const [tareas] = await conn.query('SELECT COUNT(*) as total FROM tareas');

    const totalReasignados = reasignados[0].total;

    // Contar por estado
    const [byState] = await conn.query(`
      SELECT estado, COUNT(*) as count
      FROM reasignados
      GROUP BY estado
      ORDER BY count DESC
    `);

    console.log(`\n✓ REASIGNADOS: ${totalReasignados}`);
    console.log(`✓ ENVIADOS: ${enviados[0].total} (LIMPIO)`);
    console.log(`✓ TAREAS: ${tareas[0].total} (LIMPIO)`);

    console.log('\nPor estado:');
    byState.forEach(row => {
      console.log(`  • ${row.estado}: ${row.count}`);
    });

    console.log('\n✅ Seed completado exitosamente');
    console.log(`\n📝 Usuario: ${usuarioNombre} (${usuarioId})`);
    console.log(`📧 Correo: acasa@quito-turismo.gob.ec`);
    console.log(`📋 Registros cargados: 18 (2 de cada caso)`);

  } catch (err) {
    console.error('\n❌ Error durante seed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seedTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
