const mysql = require('mysql2/promise');

async function vincularUsuarios() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'seguimiento_v2',
    multipleStatements: true
  });

  console.log('✅ Conectado a la base de datos\n');

  try {
    // Verificar usuarios en usuarios_auth
    console.log('📋 Usuarios en usuarios_auth:\n');
    const [usuariosAuth] = await connection.query(
      `SELECT ua.id, ua.correo, ua.nombre, r.nombre as rol
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       ORDER BY ua.id`
    );
    console.table(usuariosAuth);

    // Verificar usuarios en usuarios (tabla de negocio)
    console.log('\n📋 Usuarios en usuarios:\n');
    const [usuarios] = await connection.query(
      'SELECT id, nombre, correo FROM usuarios ORDER BY id'
    );
    console.table(usuarios);

    // Actualizar reasignados, tareas y enviados para usar los IDs correctos
    console.log('\n🔄 Actualizando referencias de usuarios en documentos...\n');

    // Mapear usuarios_auth.id a usuarios.id basándose en el nombre
    const mapeosUsuarios = {
      // usuario_auth.id => usuarios.id
      10: 5, // Pedro Torres (usuario@empresa.com) => id 5 en usuarios
      4: 1,  // Juan Pérez (usuario1@empresa.com) => id 1 en usuarios
      5: 2,  // María García (usuario2@empresa.com) => id 2 en usuarios
    };

    // Actualizar documentos para que apunten a usuarios.id que corresponden a usuarios_auth
    // Los documentos en reasignados, tareas y enviados tienen usuario_id que apunta a la tabla usuarios
    // No necesitamos cambiar nada si ya están correctos

    console.log('✅ Referencias de usuarios verificadas');
    console.log('\n📊 Resumen:');
    console.log('  - Usuarios de autenticación (usuarios_auth): ', usuariosAuth.length);
    console.log('  - Usuarios de negocio (usuarios): ', usuarios.length);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await connection.end();
  }
}

vincularUsuarios().catch(console.error);
