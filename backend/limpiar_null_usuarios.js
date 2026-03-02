const db = require('./src/db');

async function limpiarDatos() {
  try {
    console.log('🧹 Limpiando registros con usuario_id NULL...\n');
    
    // Eliminar registros con usuario_id NULL
    const [r1] = await db.query('DELETE FROM reasignados WHERE usuario_id IS NULL');
    console.log(`✅ Reasignados eliminados: ${r1.affectedRows}`);
    
    const [r2] = await db.query('DELETE FROM tareas WHERE usuario_id IS NULL');
    console.log(`✅ Tareas eliminadas: ${r2.affectedRows}`);
    
    // Contar registros restantes
    const [[countR]] = await db.query('SELECT COUNT(*) as total FROM reasignados');
    const [[countT]] = await db.query('SELECT COUNT(*) as total FROM tareas');
    const [[countE]] = await db.query('SELECT COUNT(*) as total FROM enviados');
    
    console.log('\n📊 Registros restantes:');
    console.log(`  Reasignados: ${countR.total}`);
    console.log(`  Tareas: ${countT.total}`);
    console.log(`  Enviados: ${countE.total}`);
    
    console.log('\n✅ Limpieza completada');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

limpiarDatos();
