-- Schema for SISTRA minimal tables

CREATE DATABASE IF NOT EXISTS sistra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistra;

CREATE TABLE IF NOT EXISTS reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(255),
  sender VARCHAR(255),
  recipient VARCHAR(255),
  subject TEXT,
  date DATETIME NULL,
  status VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tareas (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  description TEXT,
  due_date DATETIME NULL,
  assigned_to VARCHAR(255),
  status VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enviados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(255),
  `to` VARCHAR(255),
  date_sent DATETIME NULL,
  method VARCHAR(255),
  status VARCHAR(100),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
