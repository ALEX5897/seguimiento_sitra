-- Agregar columna notificar a tabla reasignados
ALTER TABLE reasignados
ADD COLUMN IF NOT EXISTS notificar BOOLEAN DEFAULT true;

-- Actualizar registros existentes para que tengan notificar = true por defecto
UPDATE reasignados SET notificar = true WHERE notificar IS NULL;
