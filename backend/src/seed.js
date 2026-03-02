const mysql = require('mysql2/promise');

async function seed() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'seguimiento_v2';

  console.log('Conectando a BD:', { host, user, database });
  const conn = await mysql.createConnection({ host, user, password, database, multipleStatements: true });

  try {
    // 1. Desactivar FK constraints temporalmente
    console.log('\n⚙️  Desactivando constraints...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✓ FK constraints desactivadas');

    // 2. Limpiar tablas (TRUNCATE en orden correcto para evitar FK constraints)
    console.log('\n🧹 Limpiando base de datos...');
    const truncateQueries = [
      'TRUNCATE TABLE reasignados',
      'TRUNCATE TABLE tareas',
      'TRUNCATE TABLE enviados',
      'TRUNCATE TABLE usuarios'
    ];

    for (const query of truncateQueries) {
      await conn.query(query);
      console.log('✓ ' + query);
    }

    // 3. Reactivar FK constraints
    console.log('\n⚙️  Reactivando constraints...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ FK constraints reactivadas');

    // 2. Insertar usuarios de prueba
    console.log('\n👥 Insertando usuarios...');
    const usuariosInsert = `
      INSERT INTO usuarios (nombre, correo, cargo, gerencia, telefono, estado) VALUES
      ('Juan Pérez', 'juan.perez@empresa.com', 'Coordinador', 'RRHH', '555-1001', 'activo'),
      ('María García', 'maria.garcia@empresa.com', 'Analista', 'Finanzas', '555-1002', 'activo'),
      ('Carlos López', 'carlos.lopez@empresa.com', 'Supervisor', 'Operaciones', '555-1003', 'activo'),
      ('Ana Rodríguez', 'ana.rodriguez@empresa.com', 'Gerente', 'Ventas', '555-1004', 'activo'),
      ('Pedro Torres', 'pedro.torres@empresa.com', 'Técnico', 'TI', '555-1005', 'activo'),
      ('Laura Silva', 'laura.silva@empresa.com', 'Asistente', 'Administración', '555-1006', 'activo');
    `;
    await conn.query(usuariosInsert);
    console.log('✓ Insertados 6 usuarios de prueba');

    // 4. Insertar documentos reasignados con datos variados (VENCIDOS Y PRÓXIMOS)
    console.log('\n📄 Insertando reasignados...');
    const reasignadosInsert = `
      INSERT INTO reasignados (numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, usuario_id, estado, asunto, importancia) VALUES
      ('DOC-001', 'Memorando', 'TR-001', '2026-02-15', '2026-02-20', '2026-02-23', 'Juan Pérez', 1, 'pendiente', 'Aprobación presupuesto Q1', 'alta'),
      ('DOC-002', 'Oficio', 'TR-002', '2026-02-10', '2026-02-19', '2026-02-24', 'María García', 2, 'pendiente', 'Solicitud de fondos VENCIDA', 'alta'),
      ('DOC-003', 'Acuerdo', 'TR-003', '2026-02-20', '2026-02-18', '2026-02-22', 'Carlos López', 3, 'pendiente', 'Acuerdo comercial VENCIDO', 'media'),
      ('DOC-004', 'Resolución', 'TR-004', '2026-02-18', '2026-02-15', '2026-02-21', 'Ana Rodríguez', 4, 'en_proceso', 'Resolución VENCIDA hace 3 días', 'media'),
      ('DOC-005', 'Memorando', 'TR-005', '2026-02-22', '2026-02-22', '2026-02-25', 'Pedro Torres', 5, 'pendiente', 'Evaluación próxima vencer', 'baja'),
      ('DOC-006', 'Contrato', 'TR-006', '2026-02-20', '2026-02-20', '2026-02-26', 'Laura Silva', 6, 'en_proceso', 'Contrato de servicios HOY', 'alta'),
      ('DOC-007', 'Oficio', 'TR-007', '2026-02-18', '2026-02-10', '2026-02-20', 'Juan Pérez', 1, 'en_proceso', 'Requerimiento VENCIDO', 'alta'),
      ('DOC-008', 'Acuerdo', 'TR-008', '2026-02-19', '2026-02-03', '2026-02-19', 'María García', 2, 'pendiente', 'Acuerdo vence HOY', 'media'),
      ('DOC-009', 'Memorando', 'TR-009', '2026-02-12', '2026-02-12', '2026-02-25', 'Carlos López', 3, 'en_proceso', 'Plan de trabajo próximo', 'media'),
      ('DOC-010', 'Resolución', 'TR-010', '2026-02-17', '2026-02-08', '2026-02-18', 'Ana Rodríguez', 4, 'pendiente', 'Resolución vencida HACE 6', 'alta');
    `;
    await conn.query(reasignadosInsert);
    console.log('✓ Insertados 10 reasignados de prueba');

    // 5. Insertar tareas con datos variados
    console.log('\n✅ Insertando tareas...');
    const tareasInsert = `
      INSERT INTO tareas (numero_documento, fecha_documento, fecha_asignacion, asignado_para, usuario_id, descripcion, fecha_maxima, avance, estado, nro_dias) VALUES
      ('TAREA-001', '2026-02-22', '2026-02-22', 'Pedro Torres', 5, 'Revisar documentación', '2026-02-25', '30%', 'pendiente', 3),
      ('TAREA-002', '2026-02-21', '2026-02-21', 'Laura Silva', 6, 'Procesar solicitud', '2026-03-10', '0%', 'pendiente', 17),
      ('TAREA-003', '2026-02-20', '2026-02-20', 'Juan Pérez', 1, 'Validar datos', '2026-03-01', '50%', 'en_proceso', 10),
      ('TAREA-004', '2026-02-19', '2026-02-19', 'María García', 2, 'Generar reporte', '2026-02-28', '100%', 'completada', 9),
      ('TAREA-005', '2026-02-18', '2026-02-18', 'Carlos López', 3, 'Análisis de datos', '2026-03-05', '75%', 'en_proceso', 16),
      ('TAREA-006', '2026-02-17', '2026-02-17', 'Ana Rodríguez', 4, 'Aprobación documentos', '2026-02-23', '0%', 'pendiente', 1),
      ('TAREA-007', '2026-02-16', '2026-02-16', 'Pedro Torres', 5, 'Coordinación interna', '2026-02-24', '100%', 'completada', 8),
      ('TAREA-008', '2026-02-15', '2026-02-15', 'Laura Silva', 6, 'Seguimiento proyecto', '2026-03-02', '40%', 'en_proceso', 15),
      ('TAREA-009', '2026-02-14', '2026-02-14', 'Juan Pérez', 1, 'Auditoría interna', '2026-02-28', '85%', 'en_proceso', 14),
      ('TAREA-010', '2026-02-13', '2026-02-13', 'María García', 2, 'Cierre de proceso', '2026-02-22', '100%', 'completada', 9);
    `;
    await conn.query(tareasInsert);
    console.log('✓ Insertadas 10 tareas de prueba');

    // 6. Insertar documentos enviados con datos variados
    console.log('\n📮 Insertando enviados...');
    const enviadosInsert = `
      INSERT INTO enviados (numero_documento, remitente, para, usuario_id, asunto, fecha_documento, tipo_documento, no_referencia, nro_tramite, estado) VALUES
      ('ENV-001', 'Departamento Jurídico', 'Carlos López', 3, 'Acuerdo comercial', '2026-02-20', 'Contrato', 'REF-001', 'TR-JUR-001', 'enviado'),
      ('ENV-002', 'Recursos Humanos', 'Ana Rodríguez', 4, 'Convocatoria de empleados', '2026-02-19', 'Memorando', 'REF-002', 'TR-RRHH-001', 'enviado'),
      ('ENV-003', 'Finanzas', 'Pedro Torres', 5, 'Reporte financiero', '2026-02-18', 'Reporte', 'REF-003', 'TR-FIN-001', 'recibido'),
      ('ENV-004', 'Operaciones', 'Laura Silva', 6, 'Procedimiento de auditoría', '2026-02-17', 'Procedimiento', 'REF-004', 'TR-OPE-001', 'enviado'),
      ('ENV-005', 'Dirección General', 'Juan Pérez', 1, 'Planificación estratégica', '2026-02-16', 'Propuesta', 'REF-005', 'TR-DG-001', 'recibido'),
      ('ENV-006', 'TI', 'María García', 2, 'Actualización sistema', '2026-02-15', 'Notificación', 'REF-006', 'TR-TI-001', 'enviado'),
      ('ENV-007', 'Marketing', 'Carlos López', 3, 'Campaña Q1 2026', '2026-02-14', 'Estrategia', 'REF-007', 'TR-MKT-001', 'recibido'),
      ('ENV-008', 'Compliance', 'Ana Rodríguez', 4, 'Revisión legal', '2026-02-13', 'Checklist', 'REF-008', 'TR-COMP-001', 'enviado'),
      ('ENV-009', 'Logística', 'Pedro Torres', 5, 'Optimización rutas', '2026-02-12', 'Análisis', 'REF-009', 'TR-LOG-001', 'recibido'),
      ('ENV-010', 'Calidad', 'Laura Silva', 6, 'Estándares ISO', '2026-02-11', 'Documento', 'REF-010', 'TR-CAL-001', 'enviado');
    `;
    await conn.query(enviadosInsert);
    console.log('✓ Insertados 10 enviados de prueba');

    // 6. Mostrar resumen
    console.log('\n📊 Resumen de datos cargados:');
    const [usuarios] = await conn.query('SELECT COUNT(*) as total FROM usuarios');
    const [reasignados] = await conn.query('SELECT COUNT(*) as total FROM reasignados');
    const [tareas] = await conn.query('SELECT COUNT(*) as total FROM tareas');
    const [enviados] = await conn.query('SELECT COUNT(*) as total FROM enviados');

    console.log(`✓ Usuarios: ${usuarios[0].total}`);
    console.log(`✓ Reasignados: ${reasignados[0].total}`);
    console.log(`✓ Tareas: ${tareas[0].total}`);
    console.log(`✓ Enviados: ${enviados[0].total}`);

    console.log('\n✅ Seed completado exitosamente');
  } catch (err) {
    console.error('\n❌ Error durante seed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
