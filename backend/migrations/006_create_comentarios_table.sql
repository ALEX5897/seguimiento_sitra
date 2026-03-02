-- 006_create_comentarios_table.sql
-- Crear tabla para gestionar comentarios en documentos reasignados

USE `seguimiento_v2`;

-- Tabla de comentarios para reasignados
DROP TABLE IF EXISTS comentarios_reasignados;
CREATE TABLE comentarios_reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reasignado_id BIGINT NOT NULL,
  usuario_id BIGINT NULL,
  correo_usuario VARCHAR(255) NOT NULL,
  nombre_usuario VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('secretaria', 'usuario_asignado', 'admin') NOT NULL DEFAULT 'usuario_asignado',
  contenido TEXT NOT NULL,
  tipo_comentario ENUM('comentario', 'respuesta', 'aclaracion') NOT NULL DEFAULT 'comentario',
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(255) NOT NULL,
  extra JSON,
  FOREIGN KEY (reasignado_id) REFERENCES reasignados(id) ON DELETE CASCADE,
  INDEX idx_reasignado (reasignado_id),
  INDEX idx_leido (leido),
  INDEX idx_fecha (fecha_hora)
);

-- Tabla de notificaciones del sistema
DROP TABLE IF EXISTS notificaciones_sistema;
CREATE TABLE notificaciones_sistema (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  usuario_id BIGINT NULL,
  correo_usuario VARCHAR(255) NOT NULL,
  reasignado_id BIGINT NOT NULL,
  comentario_id BIGINT NOT NULL,
  tipo_notificacion ENUM('comentario_nuevo', 'respuesta_recibida', 'documento_modificado', 'vencimiento_proximo', 'vencimiento_expirado') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura DATETIME NULL,
  urlAccion VARCHAR(512),
  extra JSON,
  FOREIGN KEY (reasignado_id) REFERENCES reasignados(id) ON DELETE CASCADE,
  FOREIGN KEY (comentario_id) REFERENCES comentarios_reasignados(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_correo (correo_usuario),
  INDEX idx_leida (leida),
  INDEX idx_fecha (fecha_creacion)
);

-- Tabla de lectura de notificaciones (para tracking)
DROP TABLE IF EXISTS notificaciones_lectura;
CREATE TABLE notificaciones_lectura (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notificacion_id BIGINT NOT NULL,
  fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (notificacion_id) REFERENCES notificaciones_sistema(id) ON DELETE CASCADE,
  INDEX idx_notificacion (notificacion_id)
);
