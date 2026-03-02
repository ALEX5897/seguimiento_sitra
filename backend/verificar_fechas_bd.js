const db = require('./src/db');

async function verificarFechasEnBD() {
  console.log('🔍 VERIFICAR FECHAS GUARDADAS EN LA BASE DE DATOS\n');
  
  try {
    const [reasignados] = await db.query(`
      SELECT 
        numero_documento,
        reasignado_a,
        fecha_max_respuesta,
        DATE(fecha_max_respuesta) as solo_fecha,
        DATE_FORMAT(fecha_max_respuesta, '%Y-%m-%d') as fecha_formateada,
        DATE_FORMAT(fecha_max_respuesta, '%Y-%m-%d %H:%i:%s') as fecha_hora_completa
      FROM reasignados 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('='.repeat(70));
    console.log('FECHAS GUARDADAS EN LA BASE DE DATOS');
    console.log('='.repeat(70));
    
    if (reasignados.length === 0) {
      console.log('⚠️  No hay registros en la tabla reasignados');
      console.log('\nPor favor, realiza una carga masiva primero para poder diagnosticar.');
    } else {
      reasignados.forEach((r, i) => {
        console.log(`\n📄 Registro ${i + 1}:`);
        console.log(`   Documento: ${r.numero_documento}`);
        console.log(`   Asignado a: ${r.reasignado_a}`);
        console.log(`   Fecha cruda: ${r.fecha_max_respuesta}`);
        console.log(`   Solo fecha: ${r.solo_fecha}`);
        console.log(`   Formateada: ${r.fecha_formateada}`);
        console.log(`   Con hora: ${r.fecha_hora_completa}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('ANÁLISIS');
    console.log('='.repeat(70));
    console.log(`
Si ves que la fecha tiene una hora diferente a 00:00:00, entonces el
problema es la zona horaria al insertar.

Si la fecha muestra un día menos del esperado, necesitamos ajustar la
conversión de números seriales de Excel a fechas DATETIME de MySQL.
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

verificarFechasEnBD();
