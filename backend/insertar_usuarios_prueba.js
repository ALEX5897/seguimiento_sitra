const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function insertarUsuariosPrueba() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'seguimiento_v2',
    multipleStatements: true
  });

  console.log('✅ Conectado a la base de datos');

  try {
    // Obtener IDs de los roles
    const [roles] = await connection.query('SELECT id, nombre FROM roles');
    const rolesMap = {};
    roles.forEach(r => rolesMap[r.nombre] = r.id);

    console.log('\n📋 Roles disponibles:', rolesMap);

    // Insertar usuarios de prueba
    const usuarios = [
      {
        correo: 'admin@empresa.com',
        nombre: 'Carlos',
        apellido: 'Administrador',
        rol: 'admin'
      },
      {
        correo: 'secretaria@empresa.com',
        nombre: 'María',
        apellido: 'González',
        rol: 'secretaria'
      },
      {
        correo: 'usuario@empresa.com',
        nombre: 'Pedro',
        apellido: 'Torres',
        rol: 'solo_vista'
      },
      {
        correo: 'juan.perez@empresa.com',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'solo_vista'
      },
      {
        correo: 'ana.rodriguez@empresa.com',
        nombre: 'Ana',
        apellido: 'Rodríguez',
        rol: 'secretaria'
      }
    ];

    console.log('\n👥 Insertando usuarios de prueba...\n');

    for (const usuario of usuarios) {
      const rolId = rolesMap[usuario.rol];
      
      if (!rolId) {
        console.log(`❌ Rol "${usuario.rol}" no encontrado para ${usuario.correo}`);
        continue;
      }

      try {
        // Intentar insertar (o actualizar si ya existe)
        await connection.query(
          `INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
           VALUES (?, ?, ?, ?, 'activo')
           ON DUPLICATE KEY UPDATE estado = 'activo', nombre = ?, apellido = ?, rol_id = ?`,
          [usuario.correo, usuario.nombre, usuario.apellido, rolId, usuario.nombre, usuario.apellido, rolId]
        );

        console.log(`✅ ${usuario.nombre} ${usuario.apellido} (${usuario.correo}) - Rol: ${usuario.rol}`);
      } catch (err) {
        console.log(`❌ Error insertando ${usuario.correo}:`, err.message);
      }
    }

    // Mostrar todos los usuarios creados
    console.log('\n📊 Usuarios en la base de datos:\n');
    const [usuariosDB] = await connection.query(
      `SELECT ua.id, ua.correo, ua.nombre, ua.apellido, r.nombre as rol, ua.estado, ua.created_at
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       ORDER BY r.nombre, ua.nombre`
    );

    console.table(usuariosDB);

    console.log('\n✅ Usuarios de prueba insertados correctamente');
    console.log('\n🔐 Puedes usar estos correos para hacer login:');
    console.log('   - admin@empresa.com (Admin - puede hacer todo)');
    console.log('   - secretaria@empresa.com (Secretaria - todo excepto gestión de usuarios)');
    console.log('   - usuario@empresa.com (Solo Vista - solo ve sus documentos)');
    console.log('   - juan.perez@empresa.com (Solo Vista)');
    console.log('   - ana.rodriguez@empresa.com (Secretaria)');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await connection.end();
  }
}

insertarUsuariosPrueba().catch(console.error);
