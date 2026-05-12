const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    const [estados] = await conn.query('SELECT id, codigo, nombre, icono, color, activo FROM catalogo_estados_reasignados ORDER BY id');

    console.log('\n✅ CATÁLOGO DE ESTADOS - REASIGNADOS\n');
    console.log('Estados registrados:\n');

    estados.forEach(e => {
      console.log(`  ${e.id}. ${e.icono} ${e.nombre.toUpperCase()}`);
      console.log(`     Código: ${e.codigo}`);
      console.log(`     Color: ${e.color}`);
      console.log(`     Activo: ${e.activo ? 'Sí' : 'No'}\n`);
    });

    console.log('📡 ENDPOINTS DISPONIBLES:\n');
    console.log('  GET  /api/catalogos/estados-reasignados');
    console.log('  GET  /api/catalogos/estados-reasignados/:codigo');
    console.log('  POST /api/catalogos/estados-reasignados');
    console.log('  PUT  /api/catalogos/estados-reasignados/:id');
    console.log('  DELETE /api/catalogos/estados-reasignados/:id\n');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
})();
