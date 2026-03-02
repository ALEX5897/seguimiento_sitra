-- Script para insertar usuarios de prueba con diferentes roles
-- Este script inserta usuarios en la tabla usuarios_auth para pruebas del sistema de login

USE seguimiento_v2;

-- Limpiar datos anteriores (opcional)
-- TRUNCATE TABLE audit_login;
-- DELETE FROM usuarios_auth WHERE correo LIKE '%@empresa.com';

-- Insertar usuarios de prueba con diferentes roles

-- Usuario 1: Admin (puede hacer todo)
INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
VALUES ('admin@empresa.com', 'Carlos', 'Administrador', 
  (SELECT id FROM roles WHERE nombre = 'admin'), 'activo')
ON DUPLICATE KEY UPDATE estado = 'activo';

-- Usuario 2: Secretaria (puede hacer todo excepto gestión de usuarios)
INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
VALUES ('secretaria@empresa.com', 'María', 'González', 
  (SELECT id FROM roles WHERE nombre = 'secretaria'), 'activo')
ON DUPLICATE KEY UPDATE estado = 'activo';

-- Usuario 3: Solo Vista (solo puede ver sus propios documentos)
INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
VALUES ('usuario@empresa.com', 'Pedro', 'Torres', 
  (SELECT id FROM roles WHERE nombre = 'solo_vista'), 'activo')
ON DUPLICATE KEY UPDATE estado = 'activo';

-- Usuario 4: Otro usuario de solo vista (para pruebas)
INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
VALUES ('juan.perez@empresa.com', 'Juan', 'Pérez', 
  (SELECT id FROM roles WHERE nombre = 'solo_vista'), 'activo')
ON DUPLICATE KEY UPDATE estado = 'activo';

-- Usuario 5: Otra secretaria
INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id, estado)
VALUES ('ana.rodriguez@empresa.com', 'Ana', 'Rodríguez', 
  (SELECT id FROM roles WHERE nombre = 'secretaria'), 'activo')
ON DUPLICATE KEY UPDATE estado = 'activo';

-- Mostrar los usuarios creados
SELECT 
  ua.id,
  ua.correo,
  ua.nombre,
  ua.apellido,
  r.nombre as rol,
  ua.estado,
  ua.created_at
FROM usuarios_auth ua
LEFT JOIN roles r ON ua.rol_id = r.id
ORDER BY r.nombre, ua.nombre;

-- Mostrar los roles disponibles
SELECT * FROM roles ORDER BY id;
