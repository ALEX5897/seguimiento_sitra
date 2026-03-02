-- 003_create_users_table.sql
-- Crear tabla de usuarios con gerencias y cargos

USE `seguimiento_v2`;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  cargo VARCHAR(255),
  gerencia VARCHAR(255),
  telefono VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'activo',
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_correo (correo),
  KEY idx_gerencia (gerencia)
);

-- Agregar columna usuario_id a reasignados para referencia de usuario
ALTER TABLE reasignados ADD COLUMN usuario_id BIGINT NULL AFTER reasignado_a;
ALTER TABLE reasignados ADD COLUMN correo_enviado_expiracion VARCHAR(100) DEFAULT 'no' AFTER usuario_id;
ALTER TABLE reasignados ADD COLUMN correo_enviado_un_dia_antes VARCHAR(100) DEFAULT 'no' AFTER correo_enviado_expiracion;

-- Agregar columna usuario_id a tareas
ALTER TABLE tareas ADD COLUMN usuario_id BIGINT NULL AFTER asignado_para;

-- Agregar columna usuario_id a enviados
ALTER TABLE enviados ADD COLUMN usuario_id BIGINT NULL AFTER para;

