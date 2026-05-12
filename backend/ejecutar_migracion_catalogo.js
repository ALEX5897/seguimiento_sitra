const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function ejecutarMigracion() {
  const host = process.env.DB_HOST || '172.16.1.63';
  const user = process.env.DB_USER || 'us_segdoc';
  const password = process.env.DB_PASS || '@2BKb+0sJX!5';
  const database = process.env.DB_NAME || 'seguimiento_sitra';

  console.log('📋 Ejecutando migración: Catálogo de Estados\n');

  const conn = await mysql.createConnection({ host, user, password, database });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/011_create_catalogo_estados.sql'), 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Ejecutando: ${statement.substring(0, 60)}...`);
        await conn.query(statement);
      }
    }

    console.log('\n✅ Migración completada exitosamente');

    // Verificar datos
    const [rows] = await conn.query('SELECT * FROM catalogo_estados_reasignados');
    console.log('\n📊 Estados registrados:');
    rows.forEach(row => {
      console.log(`  • ${row.icono} ${row.nombre} (${row.codigo})`);
    });
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

ejecutarMigracion();
