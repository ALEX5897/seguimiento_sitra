# 📋 Catálogo de Estados para Reasignados

## Descripción

El catálogo de estados es un repositorio centralizado que define los posibles estados de los documentos reasignados. Actualmente incluye dos estados:

| Estado | Código | Icono | Color | Descripción |
|--------|--------|-------|-------|-------------|
| Pendiente | `pendiente` | ⏳ | warning | Documento en espera de ser procesado |
| Completo | `completo` | ✓ | success | Documento procesado y completado |

## Endpoints API

### 1. Obtener todos los estados (GET)

```bash
GET /api/catalogos/estados-reasignados
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "codigo": "pendiente",
    "nombre": "Pendiente",
    "descripcion": "Documento en espera de ser procesado",
    "icono": "⏳",
    "color": "warning",
    "activo": true
  },
  {
    "id": 2,
    "codigo": "completo",
    "nombre": "Completo",
    "descripcion": "Documento procesado y completado",
    "icono": "✓",
    "color": "success",
    "activo": true
  }
]
```

### 2. Obtener estado por código (GET)

```bash
GET /api/catalogos/estados-reasignados/:codigo
```

**Ejemplo:**
```bash
GET /api/catalogos/estados-reasignados/pendiente
```

**Respuesta:**
```json
{
  "id": 1,
  "codigo": "pendiente",
  "nombre": "Pendiente",
  "descripcion": "Documento en espera de ser procesado",
  "icono": "⏳",
  "color": "warning",
  "activo": true
}
```

### 3. Crear nuevo estado (POST)

```bash
POST /api/catalogos/estados-reasignados
Content-Type: application/json

{
  "codigo": "en_revision",
  "nombre": "En Revisión",
  "descripcion": "Documento en proceso de revisión",
  "icono": "🔍",
  "color": "info"
}
```

**Respuesta:**
```json
{
  "id": 3,
  "codigo": "en_revision",
  "nombre": "En Revisión"
}
```

### 4. Actualizar estado (PUT)

```bash
PUT /api/catalogos/estados-reasignados/:id
Content-Type: application/json

{
  "nombre": "Pendiente (Actualizado)",
  "descripcion": "Documento esperando proceso",
  "color": "secondary"
}
```

**Respuesta:**
```json
{
  "ok": true
}
```

### 5. Desactivar estado (DELETE)

Nota: Usa soft delete (no elimina, solo marca como inactivo)

```bash
DELETE /api/catalogos/estados-reasignados/:id
```

**Respuesta:**
```json
{
  "ok": true
}
```

## Uso en Frontend

### Ejemplo en Vue.js

```javascript
// Obtener todos los estados
async function cargarEstados() {
  const response = await fetch('/api/catalogos/estados-reasignados');
  const estados = await response.json();
  return estados;
}

// Obtener un estado específico
async function obtenerEstado(codigo) {
  const response = await fetch(`/api/catalogos/estados-reasignados/${codigo}`);
  const estado = await response.json();
  return estado;
}
```

### Ejemplo de uso en select/dropdown

```vue
<template>
  <select v-model="estadoSeleccionado">
    <option value="">-- Seleccionar estado --</option>
    <option v-for="estado in estados" :key="estado.codigo" :value="estado.codigo">
      {{ estado.icono }} {{ estado.nombre }}
    </option>
  </select>
</template>

<script>
export default {
  data() {
    return {
      estados: [],
      estadoSeleccionado: ''
    }
  },
  async mounted() {
    const response = await fetch('/api/catalogos/estados-reasignados');
    this.estados = await response.json();
  }
}
</script>
```

## Estructura de la Base de Datos

```sql
CREATE TABLE catalogo_estados_reasignados (
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
```

## Campos

- **id**: Identificador único
- **codigo**: Código único del estado (ej: `pendiente`, `completo`)
- **nombre**: Nombre descriptivo (ej: "Pendiente", "Completo")
- **descripcion**: Descripción detallada del estado
- **icono**: Emoji o símbolo para representar el estado
- **color**: Color Bootstrap para la UI (ej: `warning`, `success`, `danger`)
- **activo**: Indica si el estado está activo/disponible
- **creado_en**: Timestamp de creación
- **actualizado_en**: Timestamp de última actualización

## Agregar nuevos estados

Para agregar un nuevo estado, puedes:

### Opción 1: Mediante API (POST)

```bash
curl -X POST http://localhost:3000/api/catalogos/estados-reasignados \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "en_aprobacion",
    "nombre": "En Aprobación",
    "descripcion": "Esperando aprobación del supervisor",
    "icono": "⏂",
    "color": "info"
  }'
```

### Opción 2: Directamente en BD

```sql
INSERT INTO catalogo_estados_reasignados (codigo, nombre, descripcion, icono, color)
VALUES ('en_aprobacion', 'En Aprobación', 'Esperando aprobación del supervisor', '⏂', 'info');
```

## Notas Importantes

1. **Soft Delete**: Cuando se elimina un estado (DELETE), no se elimina de la BD, solo se marca como `activo = false`
2. **Código Único**: El campo `codigo` es único y no puede repetirse
3. **Colores Bootstrap**: Los valores válidos son: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`
4. **Emojis**: Se pueden usar emojis Unicode para hacer los estados más visuales

## Ejemplos de colores y emojis

| Estado | Código | Icono | Color |
|--------|--------|-------|-------|
| Pendiente | pendiente | ⏳ | warning |
| Completo | completo | ✓ | success |
| En Revisión | en_revision | 🔍 | info |
| Rechazado | rechazado | ✗ | danger |
| En Aprobación | en_aprobacion | ⏂ | primary |
| Archivado | archivado | 📦 | secondary |
