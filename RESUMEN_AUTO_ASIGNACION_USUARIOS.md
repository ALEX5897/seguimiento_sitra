# ✅ Resumen: Auto-Asignación de Rol y Sincronización de Usuarios Keycloak

## 🎯 ¿Qué se Cambió?

Se configuró el sistema para que **cualquier usuario que ingrese con Keycloak**:

1. ✅ Se asigne **automáticamente al rol "solo_vista"**
2. ✅ Aparezca automáticamente en la **tabla de usuarios**
3. ✅ Se sincronice entre las tablas `usuarios_auth` y `usuarios`

---

## 📋 Implementación Técnica

### Backend - Cambios en `procesarTokenKeycloak()`

**Archivo:** `backend/src/routes/auth.js` (modificado)

**Cambios realizados:**

#### Para usuarios NUEVOS (líneas 399-423):
```javascript
// Antes: Solo creaba en usuarios_auth
// Ahora: Crea en ambas tablas

// 1. Crear en usuarios_auth
INSERT INTO usuarios_auth (correo, nombre, apellido, keycloak_id, rol_id)

// 2. Crear en usuarios (NUEVO)
INSERT INTO usuarios (nombre, correo, cargo, estado, extra)
```

#### Para usuarios EXISTENTES (líneas 424-452):
```javascript
// Verificar si está en usuarios
// Si NO está → Crear automáticamente
// Si SÍ está → Solo actualizar último login
```

### Datos Guardados

**En tabla `usuarios`:**
- `nombre`: Nombre completo de Keycloak
- `correo`: Email
- `cargo`: "Empleado" (por defecto)
- `estado`: "activo"
- `extra`: JSON con metadata (keycloak_id, rol_id, etc.)

---

## 🔄 Sincronización Manual

Para sincronizar usuarios que ya estaban en el sistema:

```bash
cd backend
node sync-usuarios-keycloak.js
```

**Este script:**
1. ✅ Encuentra usuarios sin sincronizar
2. ✅ Los copia a tabla `usuarios`
3. ✅ Agrega metadata de Keycloak
4. ✅ Muestra resumen detallado

---

## 🚀 Cómo Funciona

### Flujo de Nuevo Usuario

```
1. Usuario ingresa credenciales en Keycloak
2. Backend recibe token JWT
3. Decodifica información del usuario
4. ¿Existe en usuarios_auth?
   ├─ NO → Crear en usuarios_auth
   │       └─ Crear en usuarios también
   │       └─ Rol asignado: "solo_vista" (o según roles Keycloak)
   └─ SÍ → Actualizar último login
           └─ Sincronizar con usuarios si falta
5. Crear sesión y redirigir a dashboard
6. ✅ Usuario visible en Admin → Usuarios
```

### Asignación de Roles

```
Roles Keycloak          →  Rol Sistema
─────────────────────────────────────
"admin"                 →  admin
"secretaria"            →  secretaria
(ninguno o "empleado")  →  solo_vista (default)
```

---

## 📊 Resultado

### Antes
```
Usuarios_auth: ✅ (usuarios autenticados)
Usuarios:      ❌ (no aparecían en la UI)
```

### Después
```
Usuarios_auth: ✅ (usuarios autenticados)
Usuarios:      ✅ (sincronizados automáticamente)
Admin Panel:   ✅ (todos visibles)
```

---

## 🎨 Interfaz de Usuario

### Admin → Usuarios
Ahora muestra:
- ✅ Todos los usuarios Keycloak
- ✅ Nombre, email, cargo
- ✅ Rol asignado ("solo_vista" por defecto)
- ✅ Estado, fechas de creación

### Admin → Roles y Permisos
Pueden:
- ✅ Cambiar rol de usuario Keycloak
- ✅ Editar permisos del rol
- ✅ Ver usuarios asignados

---

## 💾 Archivos Creados/Modificados

### Modificados
- `backend/src/routes/auth.js` - Modificada función `procesarTokenKeycloak()`

### Creados
- `backend/sync-usuarios-keycloak.js` - Script de sincronización
- `USUARIOS_KEYCLOAK_AUTO_ASIGNACION.md` - Documentación técnica
- `RESUMEN_AUTO_ASIGNACION_USUARIOS.md` - Este documento

---

## 🧪 Testing

### Test 1: Nuevo Usuario
1. Abrir login page
2. "Ingresa con Keycloak"
3. Usar credenciales nuevas
4. Verificar:
   - ✅ Crea sesión exitosamente
   - ✅ Aparece en Admin → Usuarios
   - ✅ Rol asignado: "solo_vista"

### Test 2: Usuario Existente
1. Usuario que ya estaba en `usuarios_auth`
2. Ingresa nuevamente
3. Verificar:
   - ✅ Sesión creada
   - ✅ Ahora aparece en Admin → Usuarios (si antes no)
   - ✅ Sin duplicados

### Test 3: Cambiar Rol
1. Admin → Usuarios
2. Seleccionar usuario Keycloak
3. Cambiar rol a "secretaria"
4. Guardar
5. Verificar:
   - ✅ Cambio se guarda
   - ✅ Nuevo rol se aplica

---

## 🔍 Verificación de Datos

### En Base de Datos

```sql
-- Ver usuarios Keycloak en usuarios_auth
SELECT correo, nombre, rol_id, keycloak_id 
FROM usuarios_auth 
WHERE keycloak_id IS NOT NULL;

-- Ver usuarios sincronizados
SELECT u.correo, u.nombre, u.cargo, u.estado
FROM usuarios u
INNER JOIN usuarios_auth ua ON u.correo = ua.correo
WHERE ua.keycloak_id IS NOT NULL;

-- Ver usuarios sin sincronizar (antes de correr sync)
SELECT ua.correo
FROM usuarios_auth ua
LEFT JOIN usuarios u ON ua.correo = u.correo
WHERE u.id IS NULL AND ua.keycloak_id IS NOT NULL;
```

### En la UI

1. **Admin → Usuarios**
   - Filtrar por email del usuario
   - Verificar que aparece
   - Verificar rol = "solo_vista"

2. **Admin → Roles y Permisos**
   - Seleccionar rol "solo_vista"
   - Ver cantidad de usuarios
   - Debe incluir al usuario nuevo

---

## 🔐 Seguridad

✅ **Sin acceso total:** Usuarios nuevos obtienen "solo_vista"
✅ **Sin duplicados:** Validación de unique correo
✅ **Auditoría:** keycloak_id guardado para rastreo
✅ **Admin control:** Pueden cambiar rol cuando sea necesario
✅ **Sincronización segura:** Solo inserta si no existe

---

## 📈 Mejoras Implementadas

| Aspecto | Antes | Después |
|--------|--------|---------|
| **Usuario nuevo ingresa** | Solo en usuarios_auth | En ambas tablas ✅ |
| **Aparece en Admin** | NO | SÍ ✅ |
| **Rol asignado** | Solo si admin | Automático ✅ |
| **Rol default** | Ninguno | "solo_vista" ✅ |
| **Sincronización** | Manual | Automática ✅ |
| **Auditoría** | Limitada | Completa ✅ |

---

## 🛠️ Administración Futura

### Cambiar rol de usuario

```
Admin → Usuarios
└─ Seleccionar usuario Keycloak
   └─ Cambiar rol a "secretaria" o "admin"
   └─ Guardar
```

### Sincronizar usuarios existentes

```bash
node sync-usuarios-keycloak.js
```

### Ver usuarios por estado

```sql
SELECT COUNT(*) as cantidad, estado 
FROM usuarios 
WHERE keycloak_id IS NOT NULL
GROUP BY estado;
```

---

## 🚀 Ejemplo de Flujo Completo

### Escenario: Nuevo empleado ingresa por primera vez

**1. Usuario intenta acceder a la aplicación**
```
URL: http://localhost:5175/login
```

**2. Click en "Ingresa con Keycloak"**
```
Redirige a Keycloak para login
```

**3. Keycloak valida credenciales**
```
Email: juan.garcia@company.com
Roles: ["empleado"]
```

**4. Backend procesa token**
```
procesarTokenKeycloak():
  ├─ Decodifica JWT
  ├─ ¿Existe en usuarios_auth? NO
  ├─ Crear en usuarios_auth
  │  └─ rol_id = 1 (solo_vista)
  ├─ Crear en usuarios
  │  └─ nombre = "Juan García"
  │  └─ correo = "juan.garcia@company.com"
  │  └─ cargo = "Empleado"
  │  └─ estado = "activo"
  ├─ Crear sesión
  └─ Redirigir a dashboard
```

**5. Usuario ve dashboard**
```
✅ Autenticado
✅ Rol: solo_vista
✅ Puede ver sus documentos
```

**6. Admin verifica en Admin → Usuarios**
```
✅ Juan García aparece en la lista
✅ Rol: solo_vista
✅ Email: juan.garcia@company.com
✅ Cargo: Empleado
```

**7. Admin decide cambiar su rol**
```
Admin → Usuarios
└─ Seleccionar "Juan García"
   └─ Cambiar rol a "secretaria"
   └─ Guardar
   └─ ✅ Juan García ahora tiene acceso a más funciones
```

---

## 📞 Soporte

### ¿Qué hacer si el usuario no aparece en Admin?

1. **Verificar que ingresó al menos una vez**
   - Usuario debe ingresar antes de que se cree el registro

2. **Ejecutar sincronización**
   ```bash
   node sync-usuarios-keycloak.js
   ```

3. **Revisar logs del backend**
   - Buscar mensajes de error al crear usuario
   - Verificar que tablas existen

### ¿Qué hacer si el rol no es el correcto?

1. **Verificar roles en Keycloak**
   - Usuario debe tener rol "admin" o "secretaria" en Keycloak

2. **Cambiar rol en Admin**
   - Admin → Usuarios
   - Seleccionar usuario
   - Cambiar rol manualmente

3. **O agregar rol en Keycloak**
   - Agregar usuario al grupo/rol en Keycloak
   - Usuario debe ingresar nuevamente
   - Sistema actualizará el rol automáticamente (futuro)

---

## ✅ Checklist de Implementación

- [x] Modificar `procesarTokenKeycloak()` para crear en `usuarios`
- [x] Agregar sincronización para usuarios existentes
- [x] Crear script `sync-usuarios-keycloak.js`
- [x] Manejo de errores sin fallar autenticación
- [x] Guardar metadata en campo `extra`
- [x] Documentación técnica completa
- [x] Ejemplos de uso y flujos

---

## 📚 Documentación

| Documento | Propósito |
|-----------|-----------|
| **USUARIOS_KEYCLOAK_AUTO_ASIGNACION.md** | Técnica detallada |
| **RESUMEN_AUTO_ASIGNACION_USUARIOS.md** | Este resumen |

---

## 🎉 Conclusión

### Lo que cambió:
- ✅ Usuarios Keycloak ahora se asignan automáticamente a "solo_vista"
- ✅ Aparecen automáticamente en la tabla de usuarios
- ✅ Se sincronizan automáticamente entre tablas
- ✅ Admin puede cambiar sus roles cuando sea necesario

### Beneficios:
- ✅ Integración completa Keycloak ↔ Sistema
- ✅ Menos trabajo manual para admins
- ✅ Todos los usuarios visibles en una sola tabla
- ✅ Seguridad maximizada (default: solo_vista)
- ✅ Auditoría completa de datos

**¡Sistema completamente integrado y listo para producción!** 🚀

