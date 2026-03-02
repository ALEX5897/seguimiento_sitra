-- 002_create_tables_spanish.sql
-- Recreate tables with Spanish column names

USE `seguimiento_v2`;


DROP TABLE IF EXISTS reasignados;
CREATE TABLE reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  tipo_documento VARCHAR(255),
  numero_tramite VARCHAR(255),
  fecha_documento DATETIME NULL,
  fecha_reasignacion DATETIME NULL,
  fecha_max_respuesta DATETIME NULL,
  reasignado_a VARCHAR(255),
  comentario TEXT,
  respuesta TEXT,
  remitente VARCHAR(255),
  destinatario VARCHAR(255),
  asunto TEXT,
  estado VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


DROP TABLE IF EXISTS tareas;
CREATE TABLE tareas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  fecha_documento DATETIME NULL,
  fecha_asignacion DATETIME NULL,
  asignado_para VARCHAR(255),
  descripcion TEXT,
  fecha_maxima DATETIME NULL,
  avance VARCHAR(100),
  estado VARCHAR(100),
  nro_dias INT NULL,
  remitente VARCHAR(255),
  destinatario VARCHAR(255),
  asunto TEXT,
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


DROP TABLE IF EXISTS enviados;
CREATE TABLE enviados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  remitente VARCHAR(255),
  para VARCHAR(255),
  asunto TEXT,
  fecha_documento DATETIME NULL,
  no_referencia VARCHAR(255),
  tipo_documento VARCHAR(255),
  nro_tramite VARCHAR(255),
  estado VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
