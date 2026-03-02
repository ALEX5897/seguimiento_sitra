const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Iniciando migración de BD...\n');
  
  const migrationPath = path.join(__dirname, 'migrations/006_create_comentarios_table.sql');
  console.log('📁 Archivo migración:', migrationPath);
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Archivo de migración no encontrado:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Archivo migración cargado\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'seguimiento_v2',
      multipleStatements: true
    });

    console.log('✅ Conectado a BD:', process.env.DB_NAME);
    
    // Dividir por sentencias (separadas por ;)
    const statements = sql.split(';').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt.length === 0) continue;
      
      try {
        console.log(`\n⏳ Ejecutando sentencia ${i + 1}/${statements.length}...`);
        await connection.query(stmt);
        
        // Extraer nombre de tabla si es Create Table
        if (stmt.toUpperCase().includes('CREATE TABLE')) {
          const match = stmt.match(/CREATE TABLE.*?(\w+)\s*\(/i);
          if (match) {
            console.log(`   ✅ Tabla "${match[1]}" creada exitosamente`);
          }
        } else if (stmt.toUpperCase().includes('DROP TABLE')) {
          const match = stmt.match(/DROP TABLE IF EXISTS\s+(\w+)/i);
          if (match) {
            console.log(`   ✅ Tabla "${match[1]}" eliminada (si existía)`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error en sentencia ${i + 1}:`, err.message);
        throw err;
      }
    }

    console.log('\n\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');

    // Verificar tablas creadas
    console.log('📊 Verificando tablas creadas...\n');
    const [rows] = await connection.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    const tablasEsperadas = ['comentarios_reasignados', 'notificaciones_sistema', 'notificaciones_lectura'];
    
    console.log('Tablas en BD:');
    for (const tabla of tablasEsperadas) {
      const existe = rows.some(r => r.TABLE_NAME === tabla);
      console.log(`  ${existe ? '✅' : '❌'} ${tabla}`);
    }

    await connection.end();
    console.log('\n✅ Desconectado de BD');
    
  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
