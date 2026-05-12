require('dotenv').config();
const pool = require('./db');

async function verificarEstadoAdmin() {
  try {
    console.log('🔍 Verificando estado de usuario acasa...\n');

    // Buscar usuario acasa
    const [usuarios] = await pool.query(
      'SELECT id, usuario, email, rol_id, estado FROM usuarios_auth WHERE usuario = ?',
      ['acasa']
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario "acasa" no encontrado');
      process.exit(1);
    }

    const usuario = usuarios[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   - ID: ${usuario.id}`);
    console.log(`   - Usuario: ${usuario.usuario}`);
    console.log(`   - Email: ${usuario.email}`);
    console.log(`   - Rol ID: ${usuario.rol_id}`);
    console.log(`   - Estado: ${usuario.estado}`);

    // Obtener información del rol
    const [roles] = await pool.query(
      'SELECT id, nombre FROM roles WHERE id = ?',
      [usuario.rol_id]
    );

    if (roles.length > 0) {
      console.log(`   - Rol Nombre: ${roles[0].nombre}`);
    }

    // Verificar tabla notificaciones_config
    console.log('\n🔍 Verificando tabla notificaciones_config...');
    const [config] = await pool.query('SELECT * FROM notificaciones_config WHERE id = 1');

    if (config.length === 0) {
      console.log('❌ No hay configuración en notificaciones_config');
    } else {
      console.log('✅ Configuración encontrada:');
      console.log(`   - Activo: ${config[0].activo ? 'Sí' : 'No'}`);
      console.log(`   - Email activo: ${config[0].notificaciones_email_activas ? 'Sí' : 'No'}`);
      console.log(`   - App activo: ${config[0].notificaciones_app_activas ? 'Sí' : 'No'}`);
      console.log(`   - Hora envío: ${config[0].hora_envio}`);
      console.log(`   - Días retraso: ${config[0].dias_retraso}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarEstadoAdmin();
