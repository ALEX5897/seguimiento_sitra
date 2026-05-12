-- Agregar campos faltantes a tabla reasignados
USE `seguimiento_sitra`;

-- Agregar columna importancia si no existe
ALTER TABLE reasignados
ADD COLUMN importancia VARCHAR(100) DEFAULT 'Media'
AFTER tipo_documento;

-- Agregar columna usuario_id si no existe
ALTER TABLE reasignados
ADD COLUMN usuario_id BIGINT
AFTER id;

-- Agregar índices para mejorar performance
ALTER TABLE reasignados
ADD INDEX idx_usuario_id (usuario_id),
ADD INDEX idx_estado (estado),
ADD INDEX idx_importancia (importancia),
ADD INDEX idx_fecha_max_respuesta (fecha_max_respuesta);
