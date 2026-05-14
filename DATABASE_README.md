# 📊 Documentación de Base de Datos - SISTRA

## 📋 Resumen

**Nombre BD:** `seguimiento_sitra`  
**Motor:** MySQL 5.7+  
**Charset:** UTF-8 MB4  
**Colación:** utf8mb4_unicode_ci  
**Archivo Schema:** `database_schema_empty.sql`

---

## 🏗️ Estructura General

La base de datos consta de **13 tablas principales** organizadas en 5 módulos:

### 1️⃣ Módulo de Documentos (Core)
- **reasignados** — Documentos reasignados a usuarios
- **tareas** — Tareas asignadas a usuarios  
- **enviados** — Documentos enviados por usuarios

### 2️⃣ Módulo de Usuarios
- **empleados** — Catálogo de empleados (sincronizado desde Keycloak)
- **usuarios** — Tabla legada de usuarios (mantener por compatibilidad)
- **usuarios_auth** — Autenticación y sesiones
- **roles** — Definición de roles (admin, secretaria, solo_vista)
- **audit_login** — Registro de intentos de login
- **sesiones** — Gestión de sesiones activas

### 3️⃣ Módulo de Notificaciones
- **notificaciones_config** — Configuración de envíos
- **notificaciones_plantillas** — Plantillas de correo
- **notificaciones_log** — Log de envíos realizados
- **notificaciones_sistema** — Notificaciones en la app
- **notificaciones_lectura** — Tracking de lectura

### 4️⃣ Módulo de Comentarios
- **comentarios_reasignados** — Comentarios en documentos

### 5️⃣ Catálogos
- **catalogo_estados_reasignados** — Estados disponibles

---

## 📌 Instalación

### Opción 1: Desde Línea de Comandos
```bash
mysql -h 172.16.1.80 -u root -p < database_schema_empty.sql
```

### Opción 2: Desde MySQL Client
```sql
SOURCE /ruta/al/database_schema_empty.sql;
```

### Opción 3: Desde Gestor Gráfico
1. Abrir MySQL Workbench o phpMyAdmin
2. Crear nueva BD (o dejar que lo haga el script)
3. Importar `database_schema_empty.sql`

---

## 👥 Permisos Necesarios

Usuario: `usr-cont`  
Contraseña: `mas_TER$*25@`

```sql
-- Ejecutar en el servidor de BD como root/admin
GRANT ALL PRIVILEGES ON seguimiento_sitra.* TO 'usr-cont'@'%' IDENTIFIED BY 'mas_TER$*25@';
FLUSH PRIVILEGES;
```

---

## 🔑 Relaciones Principales

```
empleados ──┐
            ├─→ reasignados (usuario_id)
            ├─→ tareas (usuario_id)
            └─→ enviados (usuario_id)

roles ──→ usuarios_auth (rol_id)

reasignados ──┐
              ├─→ comentarios_reasignados (reasignado_id)
              └─→ notificaciones_sistema (reasignado_id)

comentarios_reasignados ──→ notificaciones_sistema (comentario_id)

notificaciones_sistema ──→ notificaciones_lectura (notificacion_id)
```

---

## 📊 Tablas Detalladas

### **reasignados** — Documentos Reasignados
| Campo | Tipo | Notas |
|-------|------|-------|
| id | BIGINT | PK, Auto-increment |
| numero_documento | VARCHAR(255) | Identificador del documento |
| usuario_id | BIGINT | FK → empleados(id) |
| fecha_max_respuesta | DATETIME | Fecha de vencimiento |
| estado | VARCHAR(100) | pendiente, completo, etc |
| correo_enviado_expiracion | VARCHAR(100) | Flag: 'si'/'no' |
| correo_enviado_un_dia_antes | VARCHAR(100) | Flag: 'si'/'no' |

**Índices:**
- `idx_reasignados_usuario_id` — Filtros por usuario
- `idx_reasignados_estado` — Filtros por estado
- `idx_reasignados_fecha_max` — Búsquedas por vencimiento
- `idx_reasignados_estado_fecha` — Composición para filtros complejos

---

### **tareas** — Tareas Asignadas
| Campo | Tipo | Notas |
|-------|------|-------|
| id | BIGINT | PK, Auto-increment |
| numero_documento | VARCHAR(255) | Ref. documento |
| usuario_id | BIGINT | FK → empleados(id) |
| fecha_maxima | DATETIME | Plazo de cumplimiento |
| estado | VARCHAR(100) | En progreso, completado, etc |

---

### **enviados** — Documentos Enviados
| Campo | Tipo | Notas |
|-------|------|-------|
| id | BIGINT | PK, Auto-increment |
| numero_documento | VARCHAR(255) | Ref. documento |
| usuario_id | BIGINT | FK → empleados(id) |
| fecha_documento | DATETIME | Fecha de envío |

---

### **empleados** — Catálogo de Empleados
| Campo | Tipo | Notas |
|-------|------|-------|
| id | BIGINT | PK, Auto-increment |
| usuario | VARCHAR(255) | Username único (UNIQUE) |
| correo | VARCHAR(255) | Email único (UNIQUE) |
| nombre | VARCHAR(255) | Nombre completo |
| gerencia | VARCHAR(255) | Departamento |
| estado | VARCHAR(50) | 'activo', 'inactivo' |

**Origen:** Sincronización automática desde Keycloak (cada 24h)  
**Índices:** correo, gerencia (para JOINs frecuentes)

---

### **roles** — Definición de Roles
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INT | PK, Auto-increment |
| nombre | VARCHAR(50) | 'admin', 'secretaria', 'solo_vista' (UNIQUE) |
| permisos | JSON | Objeto con permisos por funcionalidad |

**Roles Estándar:**
- `solo_vista` — Ver solo sus documentos
- `secretaria` — Gestión completa excepto usuarios
- `admin` — Acceso total

---

### **usuarios_auth** — Autenticación y Sesiones
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INT | PK, Auto-increment |
| correo | VARCHAR(255) | Único (UNIQUE) |
| keycloak_id | VARCHAR(255) | ID de Keycloak (UNIQUE) |
| rol_id | INT | FK → roles(id) |
| estado | ENUM | 'activo', 'inactivo', 'bloqueado' |
| ultimo_login | DATETIME | Último acceso |

---

### **notificaciones_config** — Configuración
| Campo | Tipo | Valor Por Defecto |
|-------|------|-------------------|
| id | INT | 1 (singleton) |
| activo | BOOLEAN | TRUE |
| hora_envio | VARCHAR(5) | '08:00' |
| dias_retraso | INT | 1 |

**Uso:** Una sola fila configurando cuándo enviar notificaciones diarias

---

### **notificaciones_plantillas** — Plantillas de Correo
| Campo | Tipo | Notas |
|-------|------|-------|
| tipo | ENUM | 'asignado', 'tarde', 'proximo_vencer' |
| asunto | VARCHAR(255) | Línea de asunto del correo |
| cuerpo_html | LONGTEXT | HTML + placeholders: {{nombre}}, {{numero_documento}}, etc |

---

## 🔗 Flujos de Datos

### Flujo 1: Asignación de Documento
```
Admin crea reasignado
  ↓
INSERT reasignados (numero_documento, usuario_id, fecha_max_respuesta, estado='pendiente')
  ↓
Sistema envía correo a empleados[usuario_id].correo
  ↓
UPDATE reasignados SET correo_enviado_expiracion='si'
  ↓
Cron nightly chequea documentos próximos a vencer
  ↓
Si faltan <1 día: UPDATE correo_enviado_un_dia_antes='si' + envía correo
```

### Flujo 2: Login de Usuario
```
Usuario ingresa correo + contraseña
  ↓
Validar en keycloak (OIDC)
  ↓
INSERT/UPDATE usuarios_auth
  ↓
INSERT audit_login (login_exitoso=true)
  ↓
INSERT sesiones + retornar JWT
```

### Flujo 3: Visualización de Documentos
```
Usuario (solo_vista) hace GET /api/reasignados
  ↓
Backend obtiene usuario_id desde usuarios_auth.id
  ↓
SELECT * FROM reasignados WHERE usuario_id = ? AND estado IN ('pendiente', 'completo')
  ↓
LEFT JOIN empleados ON reasignados.usuario_id = empleados.id
  ↓
Mostrar: numero_documento, fecha_max_respuesta, estado, nombre_empleado
```

---

## ⚙️ Operaciones de Mantenimiento

### Backup
```bash
mysqldump -h 172.16.1.80 -u usr-cont -p seguimiento_sitra > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -h 172.16.1.80 -u usr-cont -p seguimiento_sitra < backup_20260514.sql
```

### Ver tamaño de la BD
```sql
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.tables
WHERE table_schema = 'seguimiento_sitra'
ORDER BY (data_length + index_length) DESC;
```

---

## 🚀 Próximos Pasos Después del Setup

1. ✅ Crear BD (este script)
2. ⬜ Insertar roles (se hace desde aplicación o script)
3. ⬜ Sincronizar empleados desde Keycloak (cron automático)
4. ⬜ Crear usuarios_auth con rol admin inicial
5. ⬜ Cargar documentos iniciales (reasignados, tareas, enviados)

---

## 📞 Contacto / Soporte

**Equipo de Desarrollo:** Backend - Node.js + Express  
**Ubicación BD:** 172.16.1.80:3306  
**Usuario DB:** usr-cont  

Para cambios en la estructura, contactar al equipo de desarrollo.
