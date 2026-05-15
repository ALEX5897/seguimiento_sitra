# 🔐 Auto-Asignación de Rol Solo Vista para Usuarios Keycloak

## 📋 Descripción

Se ha configurado el sistema para que **cualquier usuario que ingrese con credenciales de Keycloak**:

1. ✅ Se asigne **automáticamente al rol "solo_vista"**
2. ✅ Aparezca en la **tabla de usuarios** (UI)
3. ✅ Se sincronice entre tablas `usuarios_auth` y `usuarios`

---

## 🔧 Cómo Funciona

### Flujo de Nuevo Usuario Keycloak

```
Usuario ingresa con Keycloak
        ↓
Keycloak valida credenciales
        ↓
Backend recibe token
        ↓
¿Usuario existe en usuarios_auth?
    ├─ NO → Crear en usuarios_auth
    │       ├─ Asignar rol según roles Keycloak
    │       └─ Si no coincide: "solo_vista" por defecto
    │       └─ ✅ Crear también en tabla usuarios
    │
    └─ SÍ → Actualizar último login
            └─ Sincronizar con tabla usuarios si falta
                ├─ Si no existe en usuarios → Crear
                └─ ✅ Ya aparece en UI
        ↓
Usuario autenticado con rol asignado ✅
```

### Asignación de Roles

El sistema mapea roles de Keycloak a roles del sistema:

```
Keycloak Roles          →  Sistema Roles
────────────────────────────────────────
"admin"                 →  admin (acceso total)
"secretaria"            →  secretaria (funciones principales)
"empleado" (default)    →  solo_vista (solo lectura)
(ninguno)               →  solo_vista (por defecto)
```

**Variables de entorno para personalizar:**
- `KEYCLOAK_ROLE_ADMIN` (default: "admin")
- `KEYCLOAK_ROLE_SECRETARIA` (default: "secretaria")
- `KEYCLOAK_ROLE_SOLO_VISTA` (default: "empleado")

---

## 📝 Cambios Implementados

### Backend

**Archivo:** `backend/src/routes/auth.js`

**Función:** `procesarTokenKeycloak()` (modificada)

Ahora hace lo siguiente cuando crea un nuevo usuario:

```javascript
// 1. Crear en usuarios_auth (siempre)
INSERT INTO usuarios_auth (correo, nombre, apellido, keycloak_id, rol_id, estado)

// 2. Crear en usuarios (nuevo)
INSERT INTO usuarios (nombre, correo, cargo, estado, extra, created_at, updated_at)
  - nombre: "Nombre Apellido" de Keycloak
  - correo: email de Keycloak
  - cargo: "Empleado" (por defecto)
  - estado: "activo"
  - extra: JSON con keycloak_id para auditoría
```

Y cuando el usuario ya existe:

```javascript
// 1. Verificar si está en usuarios_auth ✓
// 2. Sincronizar con tabla usuarios
//    └─ Si falta → Crear automáticamente
//    └─ Si existe → Solo actualizar último login
```

---

## 🧪 Sincronización Manual (Para Usuarios Existentes)

Si tienes usuarios que ya estaban en `usuarios_auth` (antes de este cambio), puedes sincronizarlos:

```bash
# Ejecutar el script de sincronización
cd backend
node sync-usuarios-keycloak.js
```

**El script:**
1. Encuentra usuarios en `usuarios_auth` que NO están en `usuarios`
2. Los copia a la tabla `usuarios` con información completa
3. Agrega metadata de Keycloak en el campo `extra`
4. Muestra un resumen detallado

---

## 📊 Datos Guardados

Cuando se crea un usuario desde Keycloak, se guarda:

### Tabla `usuarios_auth`:
```json
{
  "id": 5,
  "correo": "usuario@example.com",
  "nombre": "Juan",
  "apellido": "García",
  "rol_id": 1,  // "solo_vista"
  "keycloak_id": "abc123xyz",
  "estado": "activo",
  "created_at": "2026-05-13T16:30:00Z",
  "updated_at": "2026-05-13T16:30:00Z"
}
```

### Tabla `usuarios`:
```json
{
  "id": 42,
  "nombre": "Juan García",
  "correo": "usuario@example.com",
  "cargo": "Empleado",
  "gerencia": null,
  "telefono": null,
  "estado": "activo",
  "extra": {
    "keycloak_id": "abc123xyz",
    "rol_id": 1,
    "sincronizado_en": "2026-05-13T16:30:00Z"
  },
  "created_at": "2026-05-13T16:30:00Z",
  "updated_at": "2026-05-13T16:30:00Z"
}
```

---

## 🔍 Verificación

### Ver usuarios creados

```bash
# Usuarios en usuarios_auth
mysql> SELECT correo, nombre, rol_id, keycloak_id FROM usuarios_auth WHERE keycloak_id IS NOT NULL;

# Usuarios en usuarios
mysql> SELECT correo, nombre, cargo FROM usuarios WHERE correo IN (SELECT correo FROM usuarios_auth WHERE keycloak_id IS NOT NULL);
```

### Verificación en UI

1. Ir a: **Admin → Gestión de Usuarios**
2. Ver la lista de usuarios
3. ✅ Los usuarios Keycloak aparecen con rol "solo_vista"

---

## 🎯 Casos de Uso

### Caso 1: Nuevo Usuario Ingresa por Primera Vez

```
Usuario: alice@company.com
Keycloak roles: ["empleado"]
        ↓
Sistema:
  - Crea en usuarios_auth con rol "solo_vista"
  - Crea en usuarios con cargo "Empleado"
  - Usuario puede ver documentos propios
  - Aparece en Admin → Usuarios
```

### Caso 2: Admin Ingresa

```
Usuario: admin@company.com
Keycloak roles: ["admin"]
        ↓
Sistema:
  - Crea en usuarios_auth con rol "admin"
  - Crea en usuarios
  - Usuario tiene acceso total
  - Puede administrar roles y usuarios
```

### Caso 3: Usuario Existente Desde Keycloak

```
Usuario ya existe en usuarios_auth
        ↓
Sistema:
  - Verifica si está en usuarios
  - Si NO → Lo copia automáticamente
  - Si SÍ → Solo actualiza último login
  - Sin duplicados ✓
```

---

## 🔐 Seguridad

✅ **Sin duplicados:** Check: `LEFT JOIN` para evitar duplicatas
✅ **Rol por defecto:** "solo_vista" para máxima seguridad
✅ **Validación:** Solo usuarios con keycloak_id se sincronizan
✅ **Auditoría:** Se guarda keycloak_id para rastreo
✅ **Transacciones:** Errores en usuarios no afectan usuarios_auth

---

## 🛠️ Administración de Rol Asignado

### Cambiar Rol de Usuario

Como admin, puedes cambiar el rol de cualquier usuario:

1. Ir a: **Admin → Usuarios**
2. Seleccionar usuario
3. Cambiar rol de "solo_vista" a otro (ej: "secretaria")
4. Guardar ✓

### Usar Roles Keycloak

Para asignar un rol diferente basado en Keycloak:

1. En Keycloak, agregar usuario al rol "admin" o "secretaria"
2. Usuario inicia sesión
3. Sistema automáticamente lo asigna al rol correcto ✓

---

## 📋 Flujo de Login Actualizado

```
┌─ Login Page
│  └─ "Ingresa con Keycloak"
│
├─ Keycloak
│  └─ Valida usuario/contraseña
│
├─ Backend /api/auth/keycloak/callback
│  ├─ Recibe token JWT
│  ├─ Decodifica información del usuario
│  │
│  ├─ ¿Existe en usuarios_auth?
│  │  ├─ NO
│  │  │  ├─ Crea en usuarios_auth
│  │  │  │  └─ rol_id = 1 (solo_vista por defecto)
│  │  │  ├─ Crea en usuarios ✅
│  │  │  │  └─ cargo = "Empleado"
│  │  │  └─ Retorna usuario creado
│  │  │
│  │  └─ SÍ
│  │     ├─ Actualiza último_login
│  │     ├─ Sincroniza con usuarios si falta
│  │     └─ Retorna usuario existente
│  │
│  ├─ Carga permisos del rol
│  ├─ Crea sesión
│  └─ Redirige a /auth/callback
│
└─ Frontend /auth/callback
   ├─ Recibe sesión válida
   ├─ Redirige a /dashboard
   └─ ✅ Usuario autenticado y visible en Admin
```

---

## 📚 Scripts Disponibles

### Sincronizar Usuarios Existentes

```bash
cd backend
node sync-usuarios-keycloak.js
```

Muestra:
- Usuarios sin sincronizar
- Cantidad creada
- Errores encontrados
- Resumen final

---

## 🔄 Próximas Mejoras (Opcionales)

1. **Actualización de Datos:**
   - Si el usuario cambia nombre en Keycloak → sincronizar
   - Si cambia email → manejar redirección

2. **Roles Dinámicos:**
   - Leer roles de Keycloak en cada login
   - Actualizar automáticamente rol en el sistema

3. **Desactivación de Usuarios:**
   - Si usuario es desactivado en Keycloak → marcar como bloqueado

4. **Importación Masiva:**
   - Script para importar todos los usuarios de Keycloak de una vez

---

## 📞 Troubleshooting

### Problema: Usuario no aparece en Admin → Usuarios

**Solución:**
1. Verificar que el usuario ingresó al menos una vez
2. Revisar logs del backend: `tail -f [logs]`
3. Ejecutar sincronización: `node sync-usuarios-keycloak.js`

### Problema: Usuario tiene rol incorrecto

**Solución:**
1. Cambiar rol en Admin → Usuarios
2. O agregar rol en Keycloak y volver a ingresar

### Problema: Error al crear usuario

**Solución:**
1. Ver logs del backend para el error específico
2. Verificar que las tablas `usuarios` y `usuarios_auth` existen
3. Ejecutar: `node sync-usuarios-keycloak.js`

---

## ✅ Checklist de Implementación

- [x] Modificar `procesarTokenKeycloak()` para crear en usuarios
- [x] Agregar sincronización para usuarios existentes
- [x] Script `sync-usuarios-keycloak.js` creado
- [x] Manejo de errores sin fallar la autenticación
- [x] Datos guardados en campo `extra` para auditoría
- [x] Documentación completa

---

## 📊 Estadísticas Post-Implementación

Después de implementar, esperamos:

- ✅ **0 usuarios** sin sincronizar entre tablas
- ✅ **100% usuarios Keycloak** aparecen en Admin
- ✅ **Todo usuario nuevo** asignado a "solo_vista" automáticamente
- ✅ **Sincronización automática** en cada login

---

## 🎉 Conclusión

Ahora los usuarios Keycloak:
1. ✅ Se asignan automáticamente a "solo_vista"
2. ✅ Aparecen en la tabla de usuarios
3. ✅ Pueden administrarse desde Admin → Usuarios
4. ✅ Sus datos se sincronizan automáticamente
5. ✅ Se mantiene auditoría completa

**¡Sistema completamente integrado!** 🚀

