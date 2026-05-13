require('dotenv').config();
const mysql = require('mysql2/promise');

async function agregarImportancia() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado');
    console.log('🔄 Agregando importancia "Normal"...');

    try {
      await connection.query(
        'INSERT INTO catalogo_importancias (codigo, nombre, icono, color, descripcion) VALUES (?, ?, ?, ?, ?)',
        ['normal', 'Normal', '🔵', 'info', 'Importancia normal - nivel de prioridad estándar']
      );
      console.log('✓ Importancia "Normal" agregada correctamente');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ La importancia "Normal" ya existe');
      } else {
        throw err;
      }
    }

    // Mostrar todas las importancias
    const [importancias] = await connection.query(
      'SELECT id, codigo, nombre, icono, color FROM catalogo_importancias ORDER BY id'
    );

    console.log('\n📊 Catálogo de Importancias Actualizado:');
    console.log('═'.repeat(50));
    importancias.forEach((imp, index) => {
      console.log(`  ${index + 1}. ${imp.icono} ${imp.nombre.padEnd(10)} (${imp.codigo}) - ${imp.color}`);
    });
    console.log('═'.repeat(50));

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

agregarImportancia();
