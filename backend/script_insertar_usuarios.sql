-- script_insertar_usuarios.sql
-- Script para insertar usuarios de ejemplo
-- Ejecutar con: mysql -u root -p seguimiento_v2 < script_insertar_usuarios.sql

USE seguimiento_v2;

-- Limpiar usuarios existentes (opcional - comentar si no se desea)
-- DELETE FROM usuarios;

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, correo, cargo, gerencia) VALUES
('Juan Carlos López', 'juan@empresa.com', 'Gerente de Trámites', 'Gerencia de Trámites'),
('María González García', 'maria@empresa.com', 'Analista Senior', 'Gerencia de Sistemas'),
('Roberto Martínez Silva', 'roberto@empresa.com', 'Jefe de Proyectos', 'Gerencia de Proyectos'),
('Ana Victoria Rodríguez', 'ana@empresa.com', 'Coordinadora', 'Gerencia de Trámites'),
('Carlos Fernando Peña', 'carlos@empresa.com', 'Desarrollador', 'Gerencia de Sistemas');

-- Verificar que se insertaron correctamente
SELECT * FROM usuarios;
