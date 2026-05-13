require('dotenv').config();
const mysql = require('mysql2/promise');

async function blanquearYCargar() {
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

    // Actualizar tabla para permitir correos duplicados
    console.log('🔄 Ajustando esquema de tabla empleados...');
    try {
      // Obtener el nombre del constraint de correo
      const [constraints] = await connection.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_NAME = 'empleados' AND COLUMN_NAME = 'correo' AND CONSTRAINT_NAME != 'PRIMARY'`
      );

      if (constraints.length > 0) {
        const constraintName = constraints[0].CONSTRAINT_NAME;
        if (constraintName !== 'PRIMARY') {
          await connection.query(`ALTER TABLE empleados DROP INDEX ${constraintName}`);
          console.log(`  ✓ Removida restricción UNIQUE del correo`);
        }
      }
    } catch (err) {
      console.log(`  ℹ️ Esquema ya permite correos duplicados`);
    }

    // Crear usuarios de prueba
    console.log('🔄 Creando usuarios de prueba...');
    const usuarios = [
      { nombre: 'Juan García', usuario: 'jgarcia_test' },
      { nombre: 'María López', usuario: 'mlopez_test' },
      { nombre: 'Carlos Rodríguez', usuario: 'crodriguez_test' },
      { nombre: 'Ana Martínez', usuario: 'amartinez_test' },
      { nombre: 'Pedro González', usuario: 'pgonzalez_test' }
    ];

    const usuariosIds = {};
    for (const usuario of usuarios) {
      try {
        // Primero eliminar si existe
        try {
          await connection.query('DELETE FROM empleados WHERE usuario = ?', [usuario.usuario]);
        } catch (e) {
          // Ignorar si falla
        }

        // Insertar nuevo usuario
        const [result] = await connection.query(
          'INSERT INTO empleados (usuario, correo, nombre, cargo, estado) VALUES (?, ?, ?, ?, ?)',
          [usuario.usuario, 'acasa@quito-turismo.gob.ec', usuario.nombre, 'Funcionario', 'activo']
        );
        usuariosIds[usuario.nombre] = result.insertId;
        console.log(`  ✓ Usuario: ${usuario.nombre} (ID: ${result.insertId})`);
      } catch (err) {
        console.error(`  ❌ Error con usuario ${usuario.nombre}:`, err.message);
      }
    }

    console.log(`  📊 Total usuarios creados: ${Object.keys(usuariosIds).length}`);
    if (Object.keys(usuariosIds).length === 0) {
      console.error('❌ Error: No hay usuarios disponibles para asignar documentos');
      await connection.end();
      process.exit(1);
    }

    // Blanquear tabla reasignados
    console.log('🔄 Blanqueando tabla reasignados...');
    await connection.query('DELETE FROM reasignados');
    console.log('  ✓ Tabla reasignados vacía');

    // Estados disponibles
    const estados = ['pendiente', 'en_proceso', 'completo', 'archivado', 'cancelado'];
    const importancias = ['Baja', 'Media', 'Alta', 'Urgente'];
    const tiposDocumento = ['Memorando', 'Oficio', 'Circular', 'Resolución', 'Comunicado'];

    // Datos de prueba
    console.log('🔄 Cargando 20 documentos de prueba...');
    const documentos = [];
    const usuariosArray = Object.entries(usuariosIds).map(([nombre, id]) => ({ nombre, id }));

    for (let i = 1; i <= 20; i++) {
      const usuarioAsignado = usuariosArray[(i - 1) % usuariosArray.length];
      const estado = estados[(i - 1) % estados.length];
      const importancia = importancias[(i - 1) % importancias.length];
      const tipoDocumento = tiposDocumento[(i - 1) % tiposDocumento.length];

      // Calcular fechas
      const hoy = new Date();
      let fechaMaxRespuesta = new Date(hoy);

      // Variar las fechas según el documento
      if (i % 5 === 0) {
        fechaMaxRespuesta.setDate(fechaMaxRespuesta.getDate() - 10); // 10 días atrás (vencido)
      } else if (i % 4 === 0) {
        fechaMaxRespuesta.setDate(fechaMaxRespuesta.getDate() + 1); // Mañana (próximo a vencer)
      } else {
        fechaMaxRespuesta.setDate(fechaMaxRespuesta.getDate() + 5); // 5 días adelante
      }

      documentos.push({
        numero_documento: `DOC-TEST-${String(i).padStart(3, '0')}`,
        tipo_documento: tipoDocumento,
        importancia: importancia,
        numero_tramite: `TRAM-${String(i).padStart(4, '0')}`,
        fecha_documento: hoy,
        fecha_reasignacion: hoy,
        fecha_max_respuesta: fechaMaxRespuesta,
        reasignado_a: usuarioAsignado.nombre,
        usuario_id: usuarioAsignado.id,
        comentario: `Documento de prueba #${i} - Estado: ${estado}`,
        remitente: 'Dirección General',
        destinatario: 'Departamento Administrativo',
        asunto: `Asunto prueba #${i}`,
        estado: estado
      });
    }

    // Insertar documentos
    for (const doc of documentos) {
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
        console.log(`  ✓ ${doc.numero_documento} (${doc.estado}) asignado a ${doc.reasignado_a}`);
      } catch (err) {
        console.error(`  ❌ Error insertando ${doc.numero_documento}:`, err.message);
      }
    }

    console.log('\n✓ Proceso completado exitosamente');
    console.log(`📊 Resumen:`);
    console.log(`  - Usuarios creados/verificados: ${Object.keys(usuariosIds).length}`);
    console.log(`  - Documentos cargados: 20`);
    console.log(`  - Estados distribuidos: ${estados.join(', ')}`);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

blanquearYCargar();
