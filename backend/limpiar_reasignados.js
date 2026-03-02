require('dotenv').config();
const pool = require('./src/db');

async function limpiarReasignados() {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM reasignados');
    connection.release();
    console.log(`✅ Tabla reasignados limpiada. ${result.affectedRows} registros eliminados.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando tabla:', error.message);
    process.exit(1);
  }
}

limpiarReasignados();
