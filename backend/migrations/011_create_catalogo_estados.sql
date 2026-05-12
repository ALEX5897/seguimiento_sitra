-- Catálogo de Estados para Reasignados
CREATE TABLE IF NOT EXISTS catalogo_estados_reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(10),
  color VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar estados iniciales
INSERT INTO catalogo_estados_reasignados (codigo, nombre, descripcion, icono, color, activo) VALUES
('pendiente', 'Pendiente', 'Documento en espera de ser procesado', '⏳', 'warning', true),
('completo', 'Completo', 'Documento procesado y completado', '✓', 'success', true);

-- Índice para búsquedas rápidas
CREATE INDEX idx_catalogo_estados_codigo ON catalogo_estados_reasignados(codigo);
CREATE INDEX idx_catalogo_estados_activo ON catalogo_estados_reasignados(activo);
