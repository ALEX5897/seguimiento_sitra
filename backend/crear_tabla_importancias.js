require('dotenv').config();
const mysql = require('mysql2/promise');

async function crearTabla() {
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
    console.log('🔄 Creando tabla catalogo_importancias...');

    const query = `
      CREATE TABLE IF NOT EXISTS catalogo_importancias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        icono VARCHAR(10),
        color VARCHAR(50),
        activo BOOLEAN DEFAULT true,
        creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(query);
    console.log('✓ Tabla creada correctamente');

    // Insertar importancias por defecto
    console.log('🔄 Insertando importancias por defecto...');

    const importancias = [
      { codigo: 'baja', nombre: 'Baja', icono: '🟢', color: 'success' },
      { codigo: 'media', nombre: 'Media', icono: '🟡', color: 'warning' },
      { codigo: 'alta', nombre: 'Alta', icono: '🔴', color: 'danger' },
      { codigo: 'urgente', nombre: 'Urgente', icono: '⚠️', color: 'dark' }
    ];

    for (const imp of importancias) {
      try {
        await connection.query(
          'INSERT INTO catalogo_importancias (codigo, nombre, icono, color) VALUES (?, ?, ?, ?)',
          [imp.codigo, imp.nombre, imp.icono, imp.color]
        );
        console.log(`✓ Importancia "${imp.nombre}" creada`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Importancia "${imp.nombre}" ya existe`);
        } else {
          throw err;
        }
      }
    }

    console.log('✓ Proceso completado');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

crearTabla();
