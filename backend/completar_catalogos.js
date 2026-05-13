require('dotenv').config();
const mysql = require('mysql2/promise');

async function completarCatalogos() {
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

    // Agregar estados faltantes
    console.log('\n🔄 Completando catálogo de estados...');
    const estados = [
      { codigo: 'en_proceso', nombre: 'En Proceso', icono: '⚙️', color: 'info' },
      { codigo: 'archivado', nombre: 'Archivado', icono: '📦', color: 'secondary' },
      { codigo: 'cancelado', nombre: 'Cancelado', icono: '❌', color: 'danger' }
    ];

    for (const estado of estados) {
      try {
        await connection.query(
          'INSERT INTO catalogo_estados_reasignados (codigo, nombre, icono, color, activo) VALUES (?, ?, ?, ?, ?)',
          [estado.codigo, estado.nombre, estado.icono, estado.color, true]
        );
        console.log(`  ✓ Estado "${estado.nombre}" agregado`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ℹ️ Estado "${estado.nombre}" ya existe`);
        } else {
          console.error(`  ❌ Error con estado ${estado.nombre}:`, err.message);
        }
      }
    }

    // Agregar importancias faltantes
    console.log('\n🔄 Completando catálogo de importancias...');
    const importancias = [
      { codigo: 'baja', nombre: 'Baja', icono: '🟢', color: 'success' },
      { codigo: 'media', nombre: 'Media', icono: '🟡', color: 'warning' },
      { codigo: 'alta', nombre: 'Alta', icono: '🔴', color: 'danger' }
    ];

    for (const imp of importancias) {
      try {
        await connection.query(
          'INSERT INTO catalogo_importancias (codigo, nombre, icono, color, activo) VALUES (?, ?, ?, ?, ?)',
          [imp.codigo, imp.nombre, imp.icono, imp.color, true]
        );
        console.log(`  ✓ Importancia "${imp.nombre}" agregada`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ℹ️ Importancia "${imp.nombre}" ya existe`);
        } else {
          console.error(`  ❌ Error con importancia ${imp.nombre}:`, err.message);
        }
      }
    }

    // Verificar catálogos completados
    console.log('\n📊 Catálogos completados:');
    const [estadosCatalogo] = await connection.query(
      'SELECT nombre FROM catalogo_estados_reasignados WHERE activo = true ORDER BY nombre'
    );
    console.log(`  Estados: ${estadosCatalogo.map(e => e.nombre).join(', ')}`);

    const [importanciasCatalogo] = await connection.query(
      'SELECT nombre FROM catalogo_importancias WHERE activo = true ORDER BY nombre'
    );
    console.log(`  Importancias: ${importanciasCatalogo.map(i => i.nombre).join(', ')}`);

    console.log('\n✓ Catálogos completados exitosamente');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

completarCatalogos();
