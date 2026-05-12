require('dotenv').config();
const pool = require('./db');

async function verificarConfiguracion() {
  try {
    console.log('🔍 Verificando configuración...\n');

    // Buscar usuario por nombre o correo que contenga "acasa"
    const [usuarios] = await pool.query(
      'SELECT id, correo, nombre, apellido, rol_id, estado FROM usuarios_auth WHERE correo LIKE ? OR nombre LIKE ? OR apellido LIKE ?',
      ['%acasa%', '%acasa%', '%acasa%']
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario "acasa" no encontrado');
      console.log('\n📋 Todos los usuarios disponibles:');
      const [todos] = await pool.query('SELECT id, correo, nombre, apellido, rol_id FROM usuarios_auth LIMIT 10');
      todos.forEach(u => {
        console.log(`   - ID: ${u.id}, Correo: ${u.correo}, Nombre: ${u.nombre} ${u.apellido}, Rol: ${u.rol_id}`);
      });
    } else {
      const usuario = usuarios[0];
      console.log('✅ Usuario encontrado:');
      console.log(`   - ID: ${usuario.id}`);
      console.log(`   - Correo: ${usuario.correo}`);
      console.log(`   - Nombre: ${usuario.nombre} ${usuario.apellido}`);
      console.log(`   - Rol ID: ${usuario.rol_id}`);
      console.log(`   - Estado: ${usuario.estado}`);

      // Obtener nombre del rol
      const [roles] = await pool.query('SELECT id, nombre FROM roles WHERE id = ?', [usuario.rol_id]);
      if (roles.length > 0) {
        console.log(`   - Rol: ${roles[0].nombre}`);
      }
    }

    // Verificar tabla notificaciones_config
    console.log('\n✅ Verificando tabla notificaciones_config...');
    const [config] = await pool.query('SELECT * FROM notificaciones_config WHERE id = 1');

    if (config.length === 0) {
      console.log('❌ No hay configuración de notificaciones');
    } else {
      const cfg = config[0];
      console.log('✅ Configuración encontrada:');
      console.log(`   - Activo: ${cfg.activo ? 'SÍ' : 'NO'}`);
      console.log(`   - Email activo: ${cfg.notificaciones_email_activas ? 'SÍ' : 'NO'}`);
      console.log(`   - App activo: ${cfg.notificaciones_app_activas ? 'SÍ' : 'NO'}`);
      console.log(`   - Hora envío: ${cfg.hora_envio}`);
      console.log(`   - Días retraso: ${cfg.dias_retraso}`);
      console.log(`   - Actualizado: ${cfg.updated_at}`);
    }

    // Verificar rol admin
    console.log('\n✅ Verificando roles disponibles:');
    const [roles] = await pool.query('SELECT id, nombre FROM roles');
    roles.forEach(r => {
      console.log(`   - ID: ${r.id}, Nombre: ${r.nombre}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarConfiguracion();
