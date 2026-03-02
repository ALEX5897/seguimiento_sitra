const db = require('./src/db');

async function verificar() {
  try {
    console.log('📊 VERIFICACIÓN DE DATOS CARGADOS\n');
    
    // Verificar reasignados
    const [reasignados] = await db.query(`
      SELECT r.id, r.numero_documento, r.reasignado_a, r.usuario_id, u.nombre, u.correo 
      FROM reasignados r 
      LEFT JOIN usuarios u ON r.usuario_id = u.id 
      ORDER BY r.id DESC 
      LIMIT 5
    `);
    
    console.log('✅ REASIGNADOS (últimos 5):');
    reasignados.forEach(r => {
      console.log(`  ID ${r.id}: ${r.numero_documento}`);
      console.log(`    Reasignado a: ${r.reasignado_a}`);
      console.log(`    Usuario ID: ${r.usuario_id}`);
      console.log(`    Usuario BD: ${r.nombre} (${r.correo})`);
      console.log('');
    });
    
    // Verificar tareas
    const [tareas] = await db.query(`
      SELECT t.id, t.numero_documento, t.asignado_para, t.usuario_id, u.nombre, u.correo 
      FROM tareas t 
      LEFT JOIN usuarios u ON t.usuario_id = u.id 
      ORDER BY t.id DESC 
      LIMIT 5
    `);
    
    console.log('✅ TAREAS (últimas 5):');
    tareas.forEach(t => {
      console.log(`  ID ${t.id}: ${t.numero_documento}`);
      console.log(`    Asignado para: ${t.asignado_para}`);
      console.log(`    Usuario ID: ${t.usuario_id}`);
      console.log(`    Usuario BD: ${t.nombre} (${t.correo})`);
      console.log('');
    });
    
    // Verificar enviados
    const [enviados] = await db.query(`
      SELECT e.id, e.numero_documento, e.para, e.usuario_id, u.nombre, u.correo 
      FROM enviados e 
      LEFT JOIN usuarios u ON e.usuario_id = u.id 
      ORDER BY e.id DESC 
      LIMIT 5
    `);
    
    console.log('✅ ENVIADOS (últimos 5):');
    enviados.forEach(e => {
      console.log(`  ID ${e.id}: ${e.numero_documento}`);
      console.log(`    Para: ${e.para}`);
      console.log(`    Usuario ID: ${e.usuario_id || '(sin usuario)'}`);
      if (e.usuario_id) {
        console.log(`    Usuario BD: ${e.nombre} (${e.correo})`);
      }
      console.log('');
    });
    
    // Conteo total
    const [[countR]] = await db.query('SELECT COUNT(*) as total FROM reasignados');
    const [[countT]] = await db.query('SELECT COUNT(*) as total FROM tareas');
    const [[countE]] = await db.query('SELECT COUNT(*) as total FROM enviados');
    
    console.log('📈 TOTALES EN BASE DE DATOS:');
    console.log(`  Reasignados: ${countR.total}`);
    console.log(`  Tareas: ${countT.total}`);
    console.log(`  Enviados: ${countE.total}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verificar();
