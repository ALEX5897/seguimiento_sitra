-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  permisos JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios_auth (
  id INT PRIMARY KEY AUTO_INCREMENT,
  correo VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  keycloak_id VARCHAR(255) UNIQUE,
  rol_id INT NOT NULL DEFAULT 1,
  estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
  ultimo_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_correo (correo),
  INDEX idx_keycloak_id (keycloak_id)
);

-- Insertar roles predefinidos
INSERT INTO roles (nombre, descripcion, permisos) VALUES
(
  'solo_vista',
  'Puede visualizar solo sus documentos y tareas reasignados',
  JSON_OBJECT(
    'dashboard', true,
    'reportes.ver', true,
    'reportes.descargar', true,
    'usuarios', false,
    'reasignaciones', false,
    'settings', false
  )
),
(
  'secretaria',
  'Puede hacer todo menos el módulo de usuarios',
  JSON_OBJECT(
    'dashboard', true,
    'reportes.ver', true,
    'reportes.descargar', true,
    'reportes.crear', true,
    'usuarios', false,
    'reasignaciones', true,
    'settings', false
  )
),
(
  'admin',
  'Tiene acceso total a toda la aplicación',
  JSON_OBJECT(
    'dashboard', true,
    'reportes.ver', true,
    'reportes.descargar', true,
    'reportes.crear', true,
    'usuarios', true,
    'reasignaciones', true,
    'settings', true
  )
);

-- Tabla de Auditoría de Acceso
CREATE TABLE IF NOT EXISTS audit_login (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT,
  correo VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  login_exitoso BOOLEAN DEFAULT false,
  motivo_fallo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios_auth(id) ON DELETE SET NULL,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_fecha (created_at)
);

-- Tabla de Sesiones
CREATE TABLE IF NOT EXISTS sesiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  token VARCHAR(500),
  keycloak_token VARCHAR(1000),
  expires_at DATETIME,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios_auth(id) ON DELETE CASCADE,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_token (token)
);
