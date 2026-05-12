require('dotenv').config();
const pool = require('./db');

async function verificarEstructura() {
  try {
    console.log('🔍 Verificando estructura de tablas...\n');

    // Listar tablas
    const [tablas] = await pool.query("SHOW TABLES");
    console.log('📋 Tablas disponibles:');
    tablas.forEach(t => {
      const name = t[Object.keys(t)[0]];
      console.log(`   - ${name}`);
    });

    // Estructura de usuarios_auth
    console.log('\n🔍 Estructura de usuarios_auth:');
    const [estructura] = await pool.query("DESCRIBE usuarios_auth");
    estructura.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // Primeros usuarios
    console.log('\n🔍 Primeros usuarios en usuarios_auth:');
    const [usuarios] = await pool.query('SELECT * FROM usuarios_auth LIMIT 5');
    if (usuarios.length > 0) {
      console.log(`   Encontrados ${usuarios.length} usuarios:`);
      usuarios.forEach(u => {
        console.log(`   - ID: ${u.id}, Email: ${u.email}, Rol ID: ${u.rol_id}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarEstructura();
