-- Tablas para configuración y plantillas de notificaciones

CREATE TABLE IF NOT EXISTS notificaciones_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  activo BOOLEAN DEFAULT TRUE,
  hora_envio VARCHAR(5) DEFAULT '08:00',
  dias_retraso INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO notificaciones_config (id, activo, hora_envio, dias_retraso)
VALUES (1, TRUE, '08:00', 1);

CREATE TABLE IF NOT EXISTS notificaciones_plantillas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('asignado', 'tarde') NOT NULL UNIQUE,
  asunto VARCHAR(255) NOT NULL,
  cuerpo_html LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO notificaciones_plantillas (tipo, asunto, cuerpo_html) VALUES
('asignado', 'SITRA: Nuevo documento asignado', '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>Se le ha asignado el documento <strong>{{numero_documento}}</strong> con fecha límite <strong>{{fecha_max_respuesta}}</strong>.</p><p>Por favor revise su bandeja de seguimiento.</p>'),
('tarde', 'SITRA: Documento(s) con retraso', '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>Tiene <strong>{{cantidad}}</strong> documento(s) con retraso que requieren atención urgente.</p><p>Documentos afectados:</p>{{tabla_documentos}}<p>Ingrese al sistema para tomar acciones necesarias.</p>');
