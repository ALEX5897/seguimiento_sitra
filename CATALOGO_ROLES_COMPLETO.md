# 🛡️ Catálogo Completo de Roles y Permisos

## 📋 Descripción General

Se ha implementado un **sistema completo de gestión de roles y permisos** que permite a los administradores:

- ✅ Crear nuevos roles personalizados
- ✅ Editar roles existentes
- ✅ Asignar/modificar permisos granulares por rol
- ✅ Eliminar roles (con validaciones)
- ✅ Ver cantidad de usuarios asignados a cada rol
- ✅ Interfaz visual amigable e intuitiva
- ✅ API RESTful completa

**Estado:** 🎉 **IMPLEMENTADO Y LISTO PARA USAR**

---

## 🔧 Componentes Implementados

### 1. Backend - API RESTful

**Archivo:** `backend/src/routes/roles.js`

#### Endpoints Disponibles:

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/roles` | Obtener todos los roles | Admin |
| GET | `/api/admin/roles/:id` | Obtener un rol específico | Admin |
| POST | `/api/admin/roles` | Crear nuevo rol | Admin |
| PUT | `/api/admin/roles/:id` | Actualizar rol | Admin |
| DELETE | `/api/admin/roles/:id` | Eliminar rol | Admin |
| GET | `/api/admin/roles/estructura/permisos` | Ver estructura de permisos | Admin |

### 2. Modelo de Datos

**Tabla:** `roles` (existente, mejorada)

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  permisos JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Relación:** `usuarios_auth.rol_id` → `roles.id`

### 3. Frontend - Interfaz Vue

**Archivo:** `frontend/src/pages/AdminRoles.vue`

**Características:**
- Panel lateral con lista de roles
- Panel principal con detalles del rol seleccionado
- Editor visual de permisos por grupo
- Modal para crear/editar roles
- Validaciones y protecciones

**Componentes:**
- Listado con contador de usuarios
- Editor de permisos con checkboxes
- Botones de acción (Editar, Eliminar)
- Modal para formulario CRUD

### 4. Rutas y Navegación

**Ruta:** `/admin/roles`
**Protección:** Solo admin (`requiereAdmin: true`)
**Menú:** "Roles y Permisos" en administración

---

## 📋 Estructura de Permisos

### Categorías Disponibles

```
┌─ Dashboard
│  ├─ dashboard (Ver dashboard)
│  └─ dashboard.estadisticas (Ver estadísticas)
│
├─ Documentos
│  ├─ documentos.ver
│  ├─ documentos.crear
│  ├─ documentos.editar
│  └─ documentos.eliminar
│
├─ Reasignaciones
│  ├─ reasignaciones.ver
│  ├─ reasignaciones.crear
│  ├─ reasignaciones.editar
│  └─ reasignaciones.eliminar
│
├─ Usuarios
│  ├─ usuarios (Acceso total)
│  ├─ usuarios.ver
│  ├─ usuarios.crear
│  ├─ usuarios.editar
│  └─ usuarios.eliminar
│
├─ Reportes
│  ├─ reportes.ver
│  ├─ reportes.generar
│  └─ reportes.descargar
│
├─ Notificaciones
│  ├─ notificaciones.ver
│  ├─ notificaciones.configurar
│  └─ notificaciones.enviar
│
└─ Configuración
   ├─ settings (Acceso total)
   ├─ settings.smtp
   └─ settings.catalogos
```

### Roles Predeterminados

#### 1. **solo_vista** (ID: 1)
- Solo lectura de documentos propios
- Ver estadísticas básicas
- Ver reportes

#### 2. **secretaria** (ID: 2)
- Ver documentos (todos)
- Ver reasignaciones
- Ver reportes
- Ver notificaciones

#### 3. **admin** (ID: 3)
- Acceso total a todas las funcionalidades
- Gestión de usuarios
- Configuración del sistema
- Gestión de roles

---

## 🚀 Cómo Usar

### Acceso a la Página

1. **Ir a Admin Panel:**
   ```
   http://localhost:5175/admin/roles
   ```

2. **O desde el Menú:**
   - Administración → Roles y Permisos

### Crear un Nuevo Rol

1. Hacer clic en **"Nuevo Rol"** (botón verde)
2. Ingresar nombre (sin espacios)
3. Agregar descripción
4. Hacer clic en **"Crear"**
5. Seleccionar el nuevo rol en la lista
6. Asignar permisos
7. Hacer clic en **"Guardar Cambios"**

### Editar Permisos de un Rol

1. Seleccionar el rol en la lista lateral
2. Ver los permisos agrupados por categoría
3. Marcar/desmarcar permisos individuales
4. O hacer clic en el nombre del grupo para habilitar/deshabilitar todos
5. Hacer clic en **"Guardar Cambios"**

### Modificar Información del Rol

1. Seleccionar el rol
2. Hacer clic en **"Editar"** (disponible solo para roles personalizados)
3. Cambiar nombre y/o descripción
4. Hacer clic en **"Actualizar"**

### Eliminar un Rol

1. Seleccionar el rol
2. Hacer clic en **"Eliminar"**
3. Confirmar la acción
4. ✅ Rol eliminado

**Restricciones:**
- No se pueden eliminar roles predeterminados (ID 1, 2, 3)
- No se puede eliminar un rol con usuarios asignados

---

## 💻 API Ejemplos

### GET - Obtener todos los roles

```bash
curl -X GET http://localhost:3000/api/admin/roles \
  -H "Cookie: connect.sid=SESSION_ID"
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "solo_vista",
    "descripcion": "Puede visualizar solo sus documentos",
    "permisos": {
      "dashboard": true,
      "documentos.ver": true,
      ...
    },
    "cantidad_usuarios": 0,
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-05-13T16:00:00Z"
  },
  ...
]
```

### POST - Crear nuevo rol

```bash
curl -X POST http://localhost:3000/api/admin/roles \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "editor",
    "descripcion": "Puede crear y editar documentos",
    "permisos": {}
  }'
```

### PUT - Actualizar permisos

```bash
curl -X PUT http://localhost:3000/api/admin/roles/4 \
  -H "Content-Type: application/json" \
  -d '{
    "permisos": {
      "documentos.ver": true,
      "documentos.crear": true,
      "documentos.editar": true
    }
  }'
```

### GET - Obtener estructura de permisos

```bash
curl -X GET http://localhost:3000/api/admin/roles/estructura/permisos
```

---

## 🔒 Seguridad y Validaciones

### Backend
- ✅ Middleware `requireAdmin` en todos los endpoints
- ✅ Validación de nombre único
- ✅ Protección de roles predeterminados
- ✅ Validación: no eliminar rol con usuarios
- ✅ Permisos guardados como JSON

### Frontend
- ✅ Solo usuarios admin pueden acceder
- ✅ Validación de campos requeridos
- ✅ Confirmación antes de eliminar
- ✅ Indicadores visuales de estado
- ✅ Mensajes de error descriptivos

---

## 📊 Flujo de Datos

```
Frontend (AdminRoles.vue)
    ↓
Fetch API Calls
    ↓
Backend (/api/admin/roles)
    ↓
Middleware (requireAdmin)
    ↓
Database (roles table)
    ↓
Response con permisos en JSON
    ↓
Frontend actualiza UI
```

---

## 🔄 Ciclo de Vida de un Rol

```
1. CREAR
   ├─ Usuario hace POST /admin/roles
   ├─ Backend valida nombre único
   ├─ Se inserta en tabla roles
   └─ Permisos inicializados como {}

2. ASIGNAR USUARIOS
   ├─ En AdminUsers.vue
   ├─ Seleccionar usuario
   ├─ Cambiar rol_id
   └─ Usuarios_auth.rol_id ahora referencia el rol

3. EDITAR PERMISOS
   ├─ En AdminRoles.vue
   ├─ Seleccionar rol
   ├─ Modificar permisos
   ├─ PUT /admin/roles/:id
   └─ BD actualizada

4. USAR PERMISOS
   ├─ Auth middleware carga rol y permisos
   ├─ Req.usuarioAuth.permisos contiene los permisos
   ├─ Frontend/Backend chequean permisos
   └─ Acceso otorgado/denegado

5. ELIMINAR
   ├─ Solo si no hay usuarios asignados
   ├─ DELETE /admin/roles/:id
   └─ Rol eliminado de BD
```

---

## 🧪 Testing

### Verificación Rápida

```bash
# 1. Backend está corriendo
curl http://localhost:3000/api/admin/roles

# 2. Frontend está corriendo
curl http://localhost:5175/admin/roles

# 3. Todos los roles se cargan
# Ver en navegador: http://localhost:5175/admin/roles
```

### Test Manual

1. **Crear rol:**
   - Nuevo Rol → nombre: "prueba" → Crear ✅

2. **Editar permisos:**
   - Seleccionar "prueba" → Marcar algunos permisos → Guardar ✅

3. **Editar información:**
   - Rol "prueba" → Editar → Cambiar descripción → Actualizar ✅

4. **Asignar a usuario:**
   - AdminUsers → Seleccionar usuario → Cambiar rol a "prueba" ✅

5. **Eliminar rol:**
   - Rol "prueba" → Eliminar → Confirmar ✅

---

## 📚 Documentación Técnica

### Archivo de Rutas Backend
**Path:** `backend/src/routes/roles.js`
**Líneas:** ~280
**Funciones:** 6 endpoints CRUD + 1 de información

### Componente Frontend
**Path:** `frontend/src/pages/AdminRoles.vue`
**Líneas:** ~400+
**Características:** Completa gestión visual

### Registros
- **Backend:** `backend/src/index.js` - Línea 15 (import), 129 (use)
- **Frontend:** `frontend/src/router/index.js` - Línea 12 (import), 33 (route)
- **Menú:** `frontend/src/App.vue` - Línea 75 (nav link)

---

## 🆘 Troubleshooting

### Problema: 404 en endpoint de roles

**Solución:**
1. Verificar que el backend está corriendo
2. Verificar que la ruta está registrada en `index.js`
3. Reiniciar el backend: `npm run dev`

### Problema: No se cargan los roles

**Solución:**
1. Abrir DevTools (F12) → Console
2. Verificar errores de red en tab Network
3. Verificar que tienes rol admin
4. Ver logs del backend

### Problema: No puedo guardar permisos

**Solución:**
1. Verificar que el usuario es admin
2. Verificar sesión activa (cookie)
3. Ver logs del backend para error específico

### Problema: No aparece en el menú

**Solución:**
1. Verificar que eres admin
2. Verificar router está actualizado
3. Limpiar cache del navegador (Ctrl+Shift+Del)
4. Reiniciar frontend

---

## 🎯 Próximos Pasos Opcionales

1. **Búsqueda/Filtrado de Roles**
   - Agregar input de búsqueda
   - Filtrar roles por nombre

2. **Duplicar Rol**
   - Botón "Duplicar" para crear rol basado en otro
   - Copia todos los permisos

3. **Importar/Exportar Permisos**
   - Exportar estructura de permisos a JSON
   - Importar desde JSON

4. **Historial de Cambios**
   - Tabla `roles_history` con auditoría
   - Quién cambió qué y cuándo

5. **Permisos Condicionales**
   - Permisos que dependen de otros
   - Ej: "editar" requiere "ver"

6. **Validación en Frontend**
   - Antes de guardar, validar rol
   - Verificar al menos 1 permiso

---

## ✅ Checklist de Implementación

- [x] Backend routes CRUD creado
- [x] Frontend component creado
- [x] Rutas registradas en router
- [x] Link en menú de navegación
- [x] Validaciones backend
- [x] Validaciones frontend
- [x] Estructura de permisos definida
- [x] API responde correctamente
- [x] UI se carga sin errores
- [x] Documentación completa

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Consultar los logs del backend
3. Ver DevTools del navegador
4. Verificar que todas las rutas están registradas

