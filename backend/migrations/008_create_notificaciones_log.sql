-- Tabla para registrar envíos de notificaciones por correo

CREATE TABLE IF NOT EXISTS notificaciones_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('notificaciones_generales', 'documentos_expirados', 'documentos_proximos', 'correo_prueba') NOT NULL,
  usuario_id INT,
  email_destino VARCHAR(255),
  cantidad_correos INT DEFAULT 1,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('enviado', 'error') DEFAULT 'enviado',
  detalles TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para mejor rendimiento
CREATE INDEX idx_notificaciones_log_tipo ON notificaciones_log(tipo);
CREATE INDEX idx_notificaciones_log_fecha ON notificaciones_log(fecha_envio);
CREATE INDEX idx_notificaciones_log_usuario ON notificaciones_log(usuario_id);