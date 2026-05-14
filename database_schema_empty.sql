-- =====================================================
-- BASE DE DATOS: SEGUIMIENTO SITRA
-- Versión: 1.0
-- Descripción: Schema vacío (solo estructura) para el
--              Sistema de Seguimiento de Documentos SITRA
-- Fecha: 2026-05-14
-- =====================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS seguimiento_sitra
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE seguimiento_sitra;

-- =====================================================
-- TABLA: reasignados
-- Descripción: Documentos reasignados a usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  tipo_documento VARCHAR(255),
  numero_tramite VARCHAR(255),
  fecha_documento DATETIME NULL,
  fecha_reasignacion DATETIME NULL,
  fecha_max_respuesta DATETIME NULL,
  reasignado_a VARCHAR(255),
  usuario_id BIGINT NULL,
  correo_enviado_expiracion VARCHAR(100) DEFAULT 'no',
  correo_enviado_un_dia_antes VARCHAR(100) DEFAULT 'no',
  comentario TEXT,
  respuesta TEXT,
  remitente VARCHAR(255),
  destinatario VARCHAR(255),
  asunto TEXT,
  estado VARCHAR(100),
  importancia VARCHAR(50),
  notificar VARCHAR(100) DEFAULT 'si',
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reasignados_usuario_id (usuario_id),
  INDEX idx_reasignados_estado (estado),
  INDEX idx_reasignados_fecha_max (fecha_max_respuesta),
  INDEX idx_reasignados_estado_fecha (estado, fecha_max_respuesta)
);

-- =====================================================
-- TABLA: tareas
-- Descripción: Tareas asignadas a usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS tareas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  fecha_documento DATETIME NULL,
  fecha_asignacion DATETIME NULL,
  asignado_para VARCHAR(255),
  usuario_id BIGINT NULL,
  descripcion TEXT,
  fecha_maxima DATETIME NULL,
  avance VARCHAR(100),
  estado VARCHAR(100),
  nro_dias INT NULL,
  remitente VARCHAR(255),
  destinatario VARCHAR(255),
  asunto TEXT,
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tareas_usuario_id (usuario_id),
  INDEX idx_tareas_estado (estado)
);

-- =====================================================
-- TABLA: enviados
-- Descripción: Documentos enviados por usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS enviados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  remitente VARCHAR(255),
  para VARCHAR(255),
  usuario_id BIGINT NULL,
  asunto TEXT,
  fecha_documento DATETIME NULL,
  no_referencia VARCHAR(255),
  tipo_documento VARCHAR(255),
  nro_tramite VARCHAR(255),
  estado VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enviados_usuario_id (usuario_id),
  INDEX idx_enviados_estado (estado)
);

-- =====================================================
-- TABLA: empleados
-- Descripción: Catálogo de empleados sincronizados
--              desde Keycloak
-- =====================================================
CREATE TABLE IF NOT EXISTS empleados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  correo VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(255),
  cargo VARCHAR(255),
  gerencia VARCHAR(255),
  telefono VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'activo',
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_empleados_id (id),
  INDEX idx_empleados_correo (correo),
  INDEX idx_empleados_gerencia (gerencia)
);

-- =====================================================
-- TABLA: usuarios (LEGADO)
-- Descripción: Tabla legada - mantener para
--              compatibilidad histórica
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  cargo VARCHAR(255),
  gerencia VARCHAR(255),
  telefono VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'activo',
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_correo (correo),
  KEY idx_gerencia (gerencia)
);

-- =====================================================
-- TABLA: roles
-- Descripción: Definición de roles de usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  permisos JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: usuarios_auth
-- Descripción: Autenticación y sesiones de usuario
-- =====================================================
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

-- =====================================================
-- TABLA: audit_login
-- Descripción: Registro de intentos de login
-- =====================================================
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

-- =====================================================
-- TABLA: sesiones
-- Descripción: Gestión de sesiones activas
-- =====================================================
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

-- =====================================================
-- TABLA: comentarios_reasignados
-- Descripción: Comentarios en documentos reasignados
-- =====================================================
CREATE TABLE IF NOT EXISTS comentarios_reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reasignado_id BIGINT NOT NULL,
  usuario_id BIGINT NULL,
  correo_usuario VARCHAR(255) NOT NULL,
  nombre_usuario VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('secretaria', 'usuario_asignado', 'admin') NOT NULL DEFAULT 'usuario_asignado',
  contenido TEXT NOT NULL,
  tipo_comentario ENUM('comentario', 'respuesta', 'aclaracion') NOT NULL DEFAULT 'comentario',
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(255) NOT NULL,
  extra JSON,
  FOREIGN KEY (reasignado_id) REFERENCES reasignados(id) ON DELETE CASCADE,
  INDEX idx_reasignado (reasignado_id),
  INDEX idx_leido (leido),
  INDEX idx_fecha (fecha_hora)
);

-- =====================================================
-- TABLA: notificaciones_sistema
-- Descripción: Notificaciones del sistema en la app
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones_sistema (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  usuario_id BIGINT NULL,
  correo_usuario VARCHAR(255) NOT NULL,
  reasignado_id BIGINT NOT NULL,
  comentario_id BIGINT NOT NULL,
  tipo_notificacion ENUM('comentario_nuevo', 'respuesta_recibida', 'documento_modificado', 'vencimiento_proximo', 'vencimiento_expirado') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura DATETIME NULL,
  urlAccion VARCHAR(512),
  extra JSON,
  FOREIGN KEY (reasignado_id) REFERENCES reasignados(id) ON DELETE CASCADE,
  FOREIGN KEY (comentario_id) REFERENCES comentarios_reasignados(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_correo (correo_usuario),
  INDEX idx_leida (leida),
  INDEX idx_fecha (fecha_creacion)
);

-- =====================================================
-- TABLA: notificaciones_lectura
-- Descripción: Tracking de lectura de notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones_lectura (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notificacion_id BIGINT NOT NULL,
  fecha_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (notificacion_id) REFERENCES notificaciones_sistema(id) ON DELETE CASCADE,
  INDEX idx_notificacion (notificacion_id)
);

-- =====================================================
-- TABLA: notificaciones_config
-- Descripción: Configuración de notificaciones por correo
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  activo BOOLEAN DEFAULT TRUE,
  hora_envio VARCHAR(5) DEFAULT '08:00',
  dias_retraso INT DEFAULT 1,
  notificaciones_email_activas BOOLEAN DEFAULT TRUE,
  notificaciones_app_activas BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: notificaciones_plantillas
-- Descripción: Plantillas de correo para notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones_plantillas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('asignado', 'tarde', 'proximo_vencer') NOT NULL UNIQUE,
  asunto VARCHAR(255) NOT NULL,
  cuerpo_html LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: notificaciones_log
-- Descripción: Log de envíos de notificaciones por correo
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('notificaciones_generales', 'documentos_expirados', 'documentos_proximos', 'documentos_asignados', 'correo_prueba') NOT NULL,
  usuario_id INT,
  email_destino VARCHAR(255),
  cantidad_correos INT DEFAULT 1,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('enviado', 'error') DEFAULT 'enviado',
  detalles TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_notificaciones_log_tipo (tipo),
  INDEX idx_notificaciones_log_fecha (fecha_envio),
  INDEX idx_notificaciones_log_usuario (usuario_id)
);

-- =====================================================
-- TABLA: catalogo_estados_reasignados
-- Descripción: Catálogo de estados para documentos
-- =====================================================
CREATE TABLE IF NOT EXISTS catalogo_estados_reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(10),
  color VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_catalogo_estados_codigo (codigo),
  INDEX idx_catalogo_estados_activo (activo)
);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Notas:
-- 1. Este schema está listo para producción
-- 2. No contiene datos (INSERT) - datos se cargarán desde
--    aplicación o scripts de sincronización
-- 3. Incluye índices para optimizar performance en queries frecuentes
-- 4. Las Foreign Keys garantizan integridad referencial
-- 5. Tabla 'usuarios' se mantiene por compatibilidad legada
-- =====================================================
