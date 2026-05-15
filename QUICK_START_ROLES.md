# ⚡ Quick Start: Gestión de Roles y Permisos

## 🚀 En 3 pasos

### 1️⃣ Iniciar servidores
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2️⃣ Ir a la página
```
http://localhost:5175/admin/roles
```

### 3️⃣ Login y administrar
- Login con usuario **admin** (Keycloak)
- ¡Listo! Ya puedes ver, crear y editar roles

---

## 📋 Qué Puedes Hacer

### Ver Roles
- Lista de todos los roles en el panel izquierdo
- Ver cuántos usuarios están asignados a cada uno
- Ver detalles del rol seleccionado

### Crear Rol Nuevo
1. Click en **"Nuevo Rol"** (botón verde)
2. Ingresar nombre (sin espacios)
3. Agregar descripción
4. Click en **"Crear"**

### Asignar Permisos
1. Seleccionar rol en la lista
2. Ver permisos agrupados por categoría
3. Marcar/desmarcar permisos individuales
4. O click en el grupo para habilitar/deshabilitar todos
5. Click en **"Guardar Cambios"**

### Editar Rol
1. Seleccionar rol
2. Click en **"Editar"**
3. Cambiar nombre/descripción
4. Click en **"Actualizar"**

### Eliminar Rol
1. Seleccionar rol
2. Click en **"Eliminar"**
3. Confirmar
4. ✅ Rol eliminado

---

## 🎯 Grupos de Permisos Disponibles

| Grupo | Descripción |
|-------|-------------|
| **Dashboard** | Ver dashboard y estadísticas |
| **Documentos** | Ver, crear, editar, eliminar documentos |
| **Reasignaciones** | Gestionar reasignaciones |
| **Usuarios** | Gestión completa de usuarios |
| **Reportes** | Ver y generar reportes |
| **Notificaciones** | Ver y configurar notificaciones |
| **Configuración** | Acceso a configuración del sistema |

---

## 🔐 Roles Predeterminados

Estos **NO se pueden editar ni eliminar:**

- **solo_vista**: Solo lectura (por defecto para nuevos usuarios)
- **secretaria**: Acceso a funciones principales
- **admin**: Acceso total (actual)

Puedes crear tus propios roles personalizados con permisos específicos.

---

## 💡 Ejemplos de Uso

### Crear Rol "Editor"

1. **Nuevo Rol**
   - Nombre: `editor`
   - Desc: "Puede crear y editar documentos"

2. **Asignar Permisos**
   - ✅ Dashboard (todos)
   - ✅ Documentos.ver
   - ✅ Documentos.crear
   - ✅ Documentos.editar
   - ✅ Reportes.ver

3. **Guardar**

4. **Asignar Usuario** (en Admin → Usuarios)
   - Seleccionar usuario
   - Cambiar rol a "editor"

### Crear Rol "Revisor"

1. **Nuevo Rol**
   - Nombre: `revisor`
   - Desc: "Revisa documentos de otros usuarios"

2. **Permisos**
   - ✅ Dashboard
   - ✅ Documentos.ver
   - ✅ Reportes (todos)

---

## 🧪 Verificación Rápida

```bash
# Verificar que todo está OK
cd backend
node verify-roles-implementation.js
```

Esperado: ✅ **¡VERIFICACIÓN COMPLETA!**

---

## ⚠️ Restricciones Importantes

- **No editar roles predeterminados** (solo_vista, secretaria, admin)
- **No eliminar rol con usuarios asignados**
- **No eliminar roles ID 1, 2, 3**
- **Nombre debe ser único**
- **Al menos un permiso por rol** (validación futura)

---

## 🆘 Problemas Comunes

### "No veo la página de Roles"
→ Verificar que eres **admin**
→ Limpiar caché del navegador (Ctrl+Shift+Del)

### "No puedo guardar permisos"
→ Ver errores en DevTools (F12)
→ Revisar que tiene sesión activa

### "Falta crear un rol"
→ Nombre debe ser único
→ No puede tener espacios

---

## 📚 Documentación Completa

Para más detalles, ver: `CATALOGO_ROLES_COMPLETO.md`

---

## ✨ Características

✅ Crear/Editar/Eliminar roles
✅ Asignar permisos granulares
✅ Ver usuarios por rol
✅ Interfaz visual intuitiva
✅ Protección de roles del sistema
✅ Validaciones en frontend y backend
✅ Mensajes de confirmación

