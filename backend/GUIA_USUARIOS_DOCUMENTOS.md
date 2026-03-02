# 👤 GUÍA: Sistema de Usuarios para Documentos y Tareas

## 🎯 Flujo del Sistema

```
1. CREAR USUARIO
   └─ Nombre, Cargo, Gerencia, Correo
   
2. CREAR DOCUMENTO/TAREA
   └─ Asignar a usuario POR NOMBRE
   
3. SISTEMA BUSCA USUARIO
   ├─ Por usuario_id (si está asignado)
   └─ Por nombre (reasignado_a) en tabla usuarios
   
4. OBTENER DATOS COMPLETOS
   └─ Nombre, Cargo, Gerencia, Correo
   
5. ENVIAR NOTIFICACIÓN
   └─ Al correo del usuario con documentos expirados/próximos
```

---

## 📋 TABLA DE USUARIOS

```sql
-- Estructura
CREATE TABLE usuarios (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,           -- Ej: "Juan Pérez García"
  correo VARCHAR(255) NOT NULL UNIQUE,    -- Ej: "juan@empresa.com"
  cargo VARCHAR(255),                      -- Ej: "Gerente de Sistemas"
  gerencia VARCHAR(255),                   -- Ej: "Gerencia de Sistemas"
  telefono VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'activo',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Ejemplo de usuarios
INSERT INTO usuarios (nombre, correo, cargo, gerencia) VALUES
('Juan Pérez García', 'juan@empresa.com', 'Gerente', 'Gerencia de Sistemas'),
('María González López', 'maria@empresa.com', 'Analista', 'Gerencia de Trámites'),
('Carlos Rodríguez Silva', 'carlos@empresa.com', 'Jefe Proyectos', 'Gerencia de Proyectos');
```

---

## 🔗 ENDPOINTS DE USUARIOS

### Lista todos los usuarios
```bash
GET /api/usuarios
```
Retorna:
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez García",
    "correo": "juan@empresa.com",
    "cargo": "Gerente",
    "gerencia": "Gerencia de Sistemas",
    "estado": "activo"
  }
]
```

### Obtener usuario POR NOMBRE (más importante)
```bash
GET /api/usuarios/nombre/Juan%20Pérez%20García
```
Retorna datos completos del usuario:
```json
{
  "id": 1,
  "nombre": "Juan Pérez García",
  "correo": "juan@empresa.com",
  "cargo": "Gerente",
  "gerencia": "Gerencia de Sistemas",
  "telefono": "+54 9 11 1234567",
  "estado": "activo"
}
```

### Buscar usuarios (autocompletar)
```bash
GET /api/usuarios/buscar/Juan
```
Retorna coincidencias:
```json
[
  {
    "id": 1,
    "nombre": "Juan Pérez García",
    "cargo": "Gerente",
    "gerencia": "Gerencia de Sistemas"
  }
]
```

### Obtener usuarios activos (para dropdowns)
```bash
GET /api/usuarios/activos/lista
```

### Obtener usuarios por gerencia
```bash
GET /api/usuarios/gerencia/Gerencia%20de%20Sistemas
```

### Crear nuevo usuario
```bash
POST /api/usuarios
```
Body:
```json
{
  "nombre": "Pedro Martínez",
  "correo": "pedro@empresa.com",
  "cargo": "Coordinador",
  "gerencia": "Gerencia de Sistemas"
}
```

---

## 📑 TABLA REASIGNADOS (Con usuarios)

```sql
-- Estructura
CREATE TABLE reasignados (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  numero_documento VARCHAR(255),
  tipo_documento VARCHAR(255),
  numero_tramite VARCHAR(255),
  fecha_documento DATETIME,
  fecha_reasignacion DATETIME,
  fecha_max_respuesta DATETIME,
  reasignado_a VARCHAR(255),          -- NOMBRE del usuario (búsqueda)
  usuario_id BIGINT,                  -- ID del usuario (enlace directo)
  correo_enviado_expiracion VARCHAR(100) DEFAULT 'no',
  correo_enviado_un_dia_antes VARCHAR(100) DEFAULT 'no',
  remitente VARCHAR(255),
  destinatario VARCHAR(255),
  asunto TEXT,
  estado VARCHAR(100),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Ejemplos
INSERT INTO reasignados 
(numero_documento, reasignado_a, usuario_id, fecha_max_respuesta, estado) 
VALUES
('DOC-001', 'Juan Pérez García', 1, '2026-02-25', 'pendiente'),
('DOC-002', 'María González López', 2, '2026-02-26', 'pendiente'),
('DOC-003', 'Juan Pérez García', 1, '2026-02-28', 'pendiente');
```

---

## 🔧 HELPERS DE USUARIO

Funciones disponibles en `src/helpers/userHelper.js`:

```javascript
// Obtener usuario completo por NOMBRE
const usuario = await obtenerUsuarioPorNombre('Juan Pérez García');
// Retorna: { id, nombre, correo, cargo, gerencia, ... }

// Obtener usuario por ID
const usuario = await obtenerUsuarioPorId(1);

// Obtener solo el ID por nombre
const usuarioId = await obtenerUserIdPorNombre('Juan Pérez García');

// Obtener correo por nombre
const correo = await obtenerCorreoPorNombre('Juan Pérez García');

// Validar que usuario existe
const existe = await validarUsuario('Juan Pérez García');

// Obtener usuarios agrupados por gerencia
const porGerencia = await obtenerUsuariosPorGerencia();
// Retorna: { 'Gerencia de Sistemas': [...], 'Gerencia de Trámites': [...] }

// Buscar usuarios (autocompletar)
const resultados = await buscarUsuarios('Juan', 10);
```

---

## 📧 FLUJO DE NOTIFICACIONES

### 1. Cronjob diario (08:00 AM)

```
┌─ Busca documentos expirados
│  └─ Agrupa por usuario (ID o nombre)
│
├─ Para cada usuario:
│  ├─ Busca en tabla usuarios por ID
│  ├─ Si no existe, busca por nombre (reasignado_a)
│  └─ Obtiene correo del usuario
│
└─ Envía correo HTML con tabla de documentos
   └─ Marca como "enviado" en BD
```

### 2. Búsqueda de usuario

```javascript
// Primero intenta por usuario_id
let usuario = await obtenerUsuario(doc.usuario_id, doc.reasignado_a);

// Si usuario_id es null, intenta por nombre
if (!usuario && doc.reasignado_a) {
  usuario = await obtenerUsuario(doc.reasignado_a);
}

// Si encontró usuario, envía correo
if (usuario) {
  await enviarNotificacionDocumentos(usuario, documentos, 'expirado');
}
```

---

## 💾 SQL ÚTIL

### Crear usuario de prueba
```sql
INSERT INTO usuarios (nombre, correo, cargo, gerencia, estado)
VALUES ('Juan Pérez García', 'juan@empresa.com', 'Gerente', 'Gerencia de Sistemas', 'activo');
```

### Obtener ID del usuario creado
```sql
SELECT LAST_INSERT_ID() AS usuario_id;
```

### Asignar documento a usuario (opción 1: por nombre)
```sql
-- El sistema buscará por nombre automáticamente
UPDATE reasignados SET reasignado_a = 'Juan Pérez García' WHERE id = 100;
```

### Asignar documento a usuario (opción 2: por ID directo)
```sql
-- Búsqueda más rápida
UPDATE reasignados SET usuario_id = 1 WHERE id = 100;
```

### Ver documentos de un usuario
```sql
SELECT numero_documento, reasignado_a, fecha_max_respuesta, estado
FROM reasignados
WHERE reasignado_a = 'Juan Pérez García' OR usuario_id = 1;
```

### Ver documentos expirados sin notificación
```sql
SELECT numero_documento, reasignado_a, correo_enviado_expiracion
FROM reasignados
WHERE DATE(fecha_max_respuesta) < DATE(NOW())
  AND correo_enviado_expiracion = 'no'
  AND estado NOT IN ('cancelado', 'resuelto');
```

### Ver usuarios sin correo
```sql
SELECT nombre, correo, estado FROM usuarios WHERE correo IS NULL OR correo = '';
```

### Limpiar historial de correos (re-enviar notificaciones)
```sql
UPDATE reasignados
SET correo_enviado_expiracion = 'no',
    correo_enviado_un_dia_antes = 'no'
WHERE reasignado_a = 'Juan Pérez García';
```

---

## 🎯 MEJORES PRÁCTICAS

✅ **Siempre crear usuario antes de asignar documento**

Incorrecto:
```json
POST /api/reasignados
{
  "numero_documento": "DOC-001",
  "reasignado_a": "Persona que no existe"
}
```

Correcto:
```json
POST /api/usuarios
{ "nombre": "Persona", "correo": "persona@empresa.com" }

POST /api/reasignados
{ "numero_documento": "DOC-001", "reasignado_a": "Persona" }
```

✅ **Usar usuario_id cuando sea posible (más rápido)**

```sql
-- Más rápido (búsqueda directa)
UPDATE reasignados SET usuario_id = 1 WHERE id = 100;

-- Más lento (búsqueda por nombre)
UPDATE reasignados SET reasignado_a = 'Juan Pérez García' WHERE id = 100;
```

✅ **Mantener nombres únicos en usuarios**

```sql
-- ✅ Bien
INSERT INTO usuarios VALUES (..., 'Juan Pérez García', ...);

-- ❌ Evitar duplicados
INSERT INTO usuarios VALUES (..., 'juan perez', ...);
INSERT INTO usuarios VALUES (..., 'J. Pérez', ...);
```

✅ **Correos únicos y activos**

```sql
-- ✅ Verificar correo
SELECT COUNT(*) FROM usuarios WHERE correo = 'juan@empresa.com';

-- ✅ Ver inactivos
SELECT * FROM usuarios WHERE estado != 'activo';
```

---

## 🧪 PRUEBAS

### 1. Crear usuario de prueba
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "correo": "test@empresa.com",
    "cargo": "Tester",
    "gerencia": "QA"
  }'
```

### 2. Buscar por nombre
```bash
curl http://localhost:3000/api/usuarios/nombre/Test%20User
```

### 3. Crear documento asignado
```bash
curl -X POST http://localhost:3000/api/reasignados \
  -H "Content-Type: application/json" \
  -d '{
    "numero_documento": "DOC-TEST-001",
    "reasignado_a": "Test User",
    "fecha_max_respuesta": "2026-02-25"
  }'
```

### 4. Ejecutar notificaciones
```bash
npm run test-notif
```

Si todo funciona, recibirá un correo el "Test User".

---

## 📱 API REST COMPLETA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/usuarios` | Listar todos |
| GET | `/api/usuarios/activos/lista` | Solo activos |
| GET | `/api/usuarios/:id` | Por ID |
| GET | `/api/usuarios/nombre/:nombre` | **Por nombre** |
| GET | `/api/usuarios/buscar/:termino` | Autocompletar |
| GET | `/api/usuarios/gerencia/:gerencia` | Por gerencia |
| POST | `/api/usuarios` | Crear |
| PUT | `/api/usuarios/:id` | Actualizar |
| DELETE | `/api/usuarios/:id` | Eliminar |

---

¿Dudas? Revisa los logs con `npm run dev` 🚀
