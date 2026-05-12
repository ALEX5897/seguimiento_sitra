require('dotenv').config();
const pool = require('./src/db');

async function crearIndices() {
  try {
    console.log('📊 Creando índices de optimización...\n');
    const connection = await pool.getConnection();

    const indices = [
      'CREATE INDEX idx_reasignados_usuario_id ON reasignados(usuario_id)',
      'CREATE INDEX idx_reasignados_estado ON reasignados(estado)',
      'CREATE INDEX idx_reasignados_fecha_max ON reasignados(fecha_max_respuesta)',
      'CREATE INDEX idx_reasignados_estado_fecha ON reasignados(estado, fecha_max_respuesta)',
      'CREATE INDEX idx_tareas_usuario_id ON tareas(usuario_id)',
      'CREATE INDEX idx_tareas_estado ON tareas(estado)',
      'CREATE INDEX idx_enviados_usuario_id ON enviados(usuario_id)',
      'CREATE INDEX idx_enviados_estado ON enviados(estado)',
      'CREATE INDEX idx_empleados_id ON empleados(id)'
    ];

    for (const sql of indices) {
      try {
        await connection.query(sql);
        const indexName = sql.match(/idx_\w+/)[0];
        console.log(`✅ ${indexName}`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          const indexName = sql.match(/idx_\w+/)[0];
          console.log(`⊘ ${indexName} (ya existe)`);
        } else {
          throw err;
        }
      }
    }

    connection.release();
    console.log('\n✅ Índices creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando índices:', error.message);
    process.exit(1);
  }
}

crearIndices();
