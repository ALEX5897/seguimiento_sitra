-- Índices para optimizar JOINs en reasignados, tareas y enviados
-- Estos índices aceleran las consultas que traen correos desde empleados

-- Índices en reasignados
CREATE INDEX idx_reasignados_usuario_id ON reasignados(usuario_id);
CREATE INDEX idx_reasignados_estado ON reasignados(estado);
CREATE INDEX idx_reasignados_fecha_max ON reasignados(fecha_max_respuesta);
CREATE INDEX idx_reasignados_estado_fecha ON reasignados(estado, fecha_max_respuesta);

-- Índices en tareas
CREATE INDEX idx_tareas_usuario_id ON tareas(usuario_id);
CREATE INDEX idx_tareas_estado ON tareas(estado);

-- Índices en enviados
CREATE INDEX idx_enviados_usuario_id ON enviados(usuario_id);
CREATE INDEX idx_enviados_estado ON enviados(estado);

-- Índice en empleados para los JOINs
CREATE INDEX idx_empleados_id ON empleados(id);
