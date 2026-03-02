const mysql = require('mysql2/promise');

async function updateAdminRole() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'seguimiento_v2'
  });

  try {
    // Obtener ID del rol admin
    const [roles] = await connection.query(`SELECT id FROM roles WHERE nombre = 'admin' LIMIT 1`);
    if (roles.length === 0) {
      console.log('❌ Rol admin no existe en la BD');
      return;
    }
    
    const adminRoleId = roles[0].id;
    console.log('🔑 ID del rol admin:', adminRoleId);
    
    // Actualizar usuario admin al rol admin
    await connection.query(
      `UPDATE usuarios_auth SET rol_id = ? WHERE correo = 'admin@admin.com'`,
      [adminRoleId]
    );
    
    console.log('✅ Usuario admin actualizado a rol admin');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
  }
}

updateAdminRole();
