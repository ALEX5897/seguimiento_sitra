const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seguimiento_v2'
  });

  try {
    // Verificar estructura de tabla
    const [columns] = await connection.query(`SHOW COLUMNS FROM usuarios_auth`);
    console.log('📋 Columnas de usuarios_auth:');
    columns.forEach(col => console.log('  -', col.Field, col.Type));

    // Buscar usuarios
    const [users] = await connection.query(`SELECT id, correo, nombre, apellido, password_hash FROM usuarios_auth LIMIT 5`);
    console.log('\n👥 Primeros 5 usuarios:');
    users.forEach(u => console.log('  -', u.correo, '|', u.nombre, u.apellido, '| Hash:', u.password_hash));
    
    // Crear usuario admin si no existe
    console.log('\n🔧 Creando/actualizando usuario admin...');
    await connection.query(
      `INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, password_hash, estado) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      ['admin@admin.com', 'Admin', 'Sistema', 1, 'admin', 'activo', 'admin']
    );
    
    console.log('✅ Usuario admin configurado');
    console.log('\n📊 Credenciales para login admin:');
    console.log('  Usuario: admin@admin.com');
    console.log('  Contraseña: admin');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
