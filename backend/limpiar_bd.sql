-- Script para limpiar la base de datos seguimiento_sitra
-- Preserva la estructura de las tablas, elimina solo los datos

USE `seguimiento_sitra`;

-- Desactivar restricciones de clave foránea temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar tablas de datos
TRUNCATE TABLE `notificaciones`;
TRUNCATE TABLE `notificaciones_log`;
TRUNCATE TABLE `reasignados`;
TRUNCATE TABLE `tareas`;
TRUNCATE TABLE `usuarios`;
TRUNCATE TABLE `comentarios`;

-- Reactivar restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 1;

-- Mostrar resumen
SELECT
  'reasignados' as tabla, COUNT(*) as registros FROM reasignados
UNION ALL
SELECT 'tareas', COUNT(*) FROM tareas
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'notificaciones', COUNT(*) FROM notificaciones
UNION ALL
SELECT 'notificaciones_log', COUNT(*) FROM notificaciones_log
UNION ALL
SELECT 'comentarios', COUNT(*) FROM comentarios;
