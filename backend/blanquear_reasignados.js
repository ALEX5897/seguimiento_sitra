const db = require('./src/db');

async function blanquearTablas() {
  try {
    console.log('🧹 Blanqueando tabla de reasignados para pruebas...\n');
    
    // Eliminar todos los registros de reasignados
    const [result] = await db.query('DELETE FROM reasignados');
    console.log(`✅ Tabla reasignados limpiada: ${result.affectedRows} registros eliminados`);
    
    // Mostrar estado actual
    const [[count]] = await db.query('SELECT COUNT(*) as total FROM reasignados');
    console.log(`📊 Registros actuales en reasignados: ${count.total}`);
    
    console.log('\n✅ Limpieza completada - Tabla lista para pruebas');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

blanquearTablas();
