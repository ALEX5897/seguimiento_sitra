const pool = require('./src/db');

async function limpiarBD() {
  try {
    console.log('🧹 Iniciando limpieza de la base de datos...');

    const connection = await pool.getConnection();

    // Desactivar restricciones de clave foránea
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✓ Restricciones de clave foránea desactivadas');

    // Limpiar tablas en orden inverso de dependencias
    const tablas = [
      'notificaciones',
      'notificaciones_log',
      'comentarios',
      'reasignados',
      'tareas',
      'usuarios',
      'enviados'
    ];

    for (const tabla of tablas) {
      try {
        const [result] = await connection.query(`TRUNCATE TABLE \`${tabla}\``);
        console.log(`✓ ${tabla}: Limpiada`);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⊘ ${tabla}: Tabla no existe`);
        } else {
          console.error(`✗ Error limpiando ${tabla}:`, err.message);
        }
      }
    }

    // Reactivar restricciones de clave foránea
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Restricciones de clave foránea reactivadas');

    // Mostrar resumen
    console.log('\n📊 Estado final de las tablas:');
    const stats = await connection.query(`
      SELECT 'reasignados' as tabla, COUNT(*) as registros FROM reasignados
      UNION ALL SELECT 'tareas', COUNT(*) FROM tareas
      UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
      UNION ALL SELECT 'notificaciones_log', COUNT(*) FROM notificaciones_log
    `);

    console.table(stats[0]);

    connection.release();
    console.log('\n✅ Base de datos limpiada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

limpiarBD();
