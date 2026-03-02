-- 004_add_importancia_to_reasignados.sql
-- Add importancia column to reasignados table

USE `seguimiento_v2`;

ALTER TABLE reasignados ADD COLUMN importancia VARCHAR(50) DEFAULT NULL AFTER tipo_documento;
