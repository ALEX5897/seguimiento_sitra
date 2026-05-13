-- Agregar tipo 'proximo_vencer' a la tabla de plantillas y agregar plantilla correspondiente

-- Primero, modificar el ENUM para incluir 'proximo_vencer'
ALTER TABLE notificaciones_plantillas
MODIFY COLUMN tipo ENUM('asignado', 'tarde', 'proximo_vencer') NOT NULL UNIQUE;

-- Modificar la tabla de log para incluir el nuevo tipo
ALTER TABLE notificaciones_log
MODIFY COLUMN tipo ENUM('notificaciones_generales', 'documentos_expirados', 'documentos_proximos', 'documentos_asignados', 'correo_prueba') NOT NULL;

-- Insertar la plantilla para documentos próximos a vencer
INSERT IGNORE INTO notificaciones_plantillas (tipo, asunto, cuerpo_html) VALUES
('proximo_vencer', 'SITRA: Documento(s) próximo a vencer', '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>Tiene <strong>{{cantidad}}</strong> documento(s) que vencerá en las próximas 24 horas.</p><p>Documentos por vencer:</p>{{tabla_documentos}}<p>Por favor tome las acciones necesarias antes de la fecha límite.</p>');

-- Actualizar las plantillas existentes con contenido mejorado
UPDATE notificaciones_plantillas
SET cuerpo_html = '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>Se le ha asignado el documento <strong>{{numero_documento}}</strong>.</p><p><strong>Detalles:</strong></p><ul><li>Tipo: {{tipo_documento}}</li><li>Remitente: {{remitente}}</li><li>Fecha límite: {{fecha_max_respuesta}}</li><li>Asunto: {{asunto}}</li></ul><p>Ingrese al sistema <strong><a href="{{url_sistema}}">SITRA</a></strong> para revisar el documento.</p><p>Saludos,<br>Sistema de Seguimiento SITRA</p>'
WHERE tipo = 'asignado';

UPDATE notificaciones_plantillas
SET cuerpo_html = '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>Tiene <strong>{{cantidad}}</strong> documento(s) con retraso que requieren atención urgente:</p><p><strong>Documentos vencidos:</strong></p>{{tabla_documentos}}<p>Por favor ingrese al sistema <strong><a href="{{url_sistema}}">SITRA</a></strong> para tomar las acciones necesarias de inmediato.</p><p>Saludos,<br>Sistema de Seguimiento SITRA</p>'
WHERE tipo = 'tarde';

-- Agregar columnas a notificaciones_config si no existen
ALTER TABLE notificaciones_config
ADD COLUMN IF NOT EXISTS notificaciones_email_activas BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notificaciones_app_activas BOOLEAN DEFAULT TRUE;
