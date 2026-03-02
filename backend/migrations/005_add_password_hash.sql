-- Agregar columna password_hash a usuarios_auth si no existe
ALTER TABLE usuarios_auth
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Hash de la contraseña para login admin';

-- Agregar valores iniciales de contraseña para usuarios admin (solo de ejemplo)
-- En BD real, estas contraseñas deberán estar hasheadas con bcrypt
-- Usuario: admin, Contraseña: admin
UPDATE usuarios_auth 
SET password_hash = 'admin'
WHERE correo = 'admin@admin.com' OR nombre = 'admin';
