# ⚡ Referencia Rápida: Usuarios Keycloak Auto-Asignación

## 🎯 Lo Esencial en 30 Segundos

**Usuarios Keycloak ahora:**
- ✅ Se asignan automáticamente a rol "solo_vista"
- ✅ Aparecen en Admin → Usuarios
- ✅ Se sincronizan automáticamente

---

## 🚀 Flujo Rápido

```
Usuario Keycloak ingresa
    ↓
¿Nuevo usuario? → Crear en ambas tablas + rol "solo_vista"
¿Usuario existente? → Sincronizar si falta
    ↓
✅ Usuario autenticado y visible en Admin
```

---

## 🧪 Para Probar

### Test 1: Nuevo usuario ingresa
```
1. Ir a: http://localhost:5175/login
2. Click "Ingresa con Keycloak"
3. Usar credenciales nuevas (ej: test@company.com)
4. Verificar: ✅ Aparece en Admin → Usuarios
```

### Test 2: Ver usuario en Admin
```
1. Admin → Usuarios
2. Buscar por email del usuario
3. Verificar:
   ✅ Nombre lleno
   ✅ Email correcto
   ✅ Cargo: "Empleado"
   ✅ Rol: "solo_vista"
```

### Test 3: Cambiar rol
```
1. Admin → Usuarios
2. Seleccionar usuario Keycloak
3. Cambiar rol a "secretaria"
4. Guardar
5. ✅ Nuevo rol aplicado
```

---

## 🔧 Sincronizar Usuarios Existentes

```bash
cd backend
node sync-usuarios-keycloak.js
```

**Muestra:**
- Usuarios sin sincronizar
- Cantidad creada/errores
- Resumen final

---

## 📊 Verificar en BD

```sql
-- Ver usuarios Keycloak
SELECT correo, nombre, cargo 
FROM usuarios 
WHERE correo IN (
  SELECT correo FROM usuarios_auth WHERE keycloak_id IS NOT NULL
);
```

---

## 🔐 Roles Default

| Rol | Acceso | Default para Nuevos |
|-----|--------|-------------------|
| solo_vista | Solo lectura | ✅ SÍ |
| secretaria | Funciones principales | NO |
| admin | Acceso total | NO |

---

## 🎓 Cambiar Rol de Usuario

```
Admin → Usuarios
  ↓
Seleccionar usuario
  ↓
Cambiar de "solo_vista" a otro
  ↓
Guardar
```

---

## 📁 Archivos Principales

| Archivo | Cambios |
|---------|---------|
| auth.js | ✏️ Modificado - procesarTokenKeycloak() |
| sync-usuarios-keycloak.js | 🆕 Nuevo script |
| Docs | 🆕 Documentación técnica |

---

## ❓ Preguntas Frecuentes

### P: ¿A qué rol se asigna un usuario nuevo?
**R:** "solo_vista" (máxima restricción)

### P: ¿Qué si el usuario ya existe en usuarios_auth?
**R:** Se sincroniza automáticamente con usuarios

### P: ¿Puedo cambiar el rol después?
**R:** Sí, desde Admin → Usuarios

### P: ¿Qué pasa con usuarios existentes?
**R:** Ejecutar `node sync-usuarios-keycloak.js`

### P: ¿Se crea automáticamente en usuarios?
**R:** Sí, en el primer login o al ejecutar el script

---

## 🆘 Si Algo No Funciona

```
Usuario no aparece en Admin?
  └─ Ejecutar: node sync-usuarios-keycloak.js

Rol incorrecto?
  └─ Cambiar manualmente desde Admin

Error en logs?
  └─ Ver: backend/logs o salida de npm run dev
```

---

## 📋 Datos Guardados

**En usuarios:**
```json
{
  "nombre": "Juan García",
  "correo": "juan@company.com",
  "cargo": "Empleado",
  "estado": "activo",
  "extra": {
    "keycloak_id": "abc123...",
    "rol_id": 1
  }
}
```

---

## ✨ Resumen

**Antes:**
```
Keycloak → usuarios_auth ✓
         → usuarios ✗
```

**Después:**
```
Keycloak → usuarios_auth ✓
         → usuarios ✓
         → Admin Panel ✓
```

---

## 🎉 ¡Listo!

Todo está automático. Los usuarios Keycloak se crean, asignan rol y aparecen en la UI sin intervención manual.

**¿Necesitas más?** Ver:
- USUARIOS_KEYCLOAK_AUTO_ASIGNACION.md (técnica)
- RESUMEN_AUTO_ASIGNACION_USUARIOS.md (detallado)

