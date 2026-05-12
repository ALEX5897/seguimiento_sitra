require('dotenv').config();
const pool = require('../db');

async function crearTablaNotificacionesConfig() {
  try {
    console.log('🔄 Creando tabla notificaciones_config...');

    // Crear tabla si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificaciones_config (
        id INT PRIMARY KEY DEFAULT 1,
        activo TINYINT(1) DEFAULT 1,
        hora_envio VARCHAR(5) DEFAULT '08:00',
        dias_retraso INT DEFAULT 1,
        notificaciones_email_activas TINYINT(1) DEFAULT 1,
        notificaciones_app_activas TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabla notificaciones_config creada');

    // Verificar si ya existe un registro con id=1
    const [rows] = await pool.query('SELECT * FROM notificaciones_config WHERE id = 1');

    if (rows.length === 0) {
      console.log('🔄 Insertando configuración por defecto...');
      await pool.query(`
        INSERT INTO notificaciones_config (
          id,
          activo,
          hora_envio,
          dias_retraso,
          notificaciones_email_activas,
          notificaciones_app_activas
        ) VALUES (1, 1, '08:00', 1, 1, 1)
      `);
      console.log('✅ Configuración por defecto insertada');
    } else {
      console.log('✅ Configuración ya existe');
    }

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  }
}

crearTablaNotificacionesConfig();
