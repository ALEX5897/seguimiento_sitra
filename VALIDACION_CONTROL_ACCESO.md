# Validación y Corrección: Control de Acceso por Rol

**Fecha:** 2026-05-13  
**Revisor:** Sistema de Auditoría

## 🔴 Problemas Críticos Encontrados

### 1. **Función `canViewAll` retornando valores incorrectos** ⚠️ CRÍTICO
**Archivo:** `backend/src/middleware/auth.js:74-81`

**Problema:**
- La función incluía roles como `solo_vista`, `solo lectura`, `lectura` retornando `true`
- Esto significaba que usuarios con rol "solo_vista" **PODÍAN VER TODOS LOS DOCUMENTOS**
- Se debería retornar `false` para estos roles (solo admin y secretaria pueden ver todo)

**Impacto:** Violación completa del control de acceso

**Corrección:**
```javascript
// ❌ ANTES (INCORRECTO)
function canViewAll(usuario) {
  const rolLower = (usuario.rol || '').toLowerCase();
  return usuario.rol === 'admin' || 
         usuario.rol === 'secretaria' || 
         rolLower === 'solo_vista' ||      // ← BUG: retorna true
         rolLower === 'solo lectura' ||    // ← BUG: retorna true
         rolLower === 'lectura';            // ← BUG: retorna true
}

// ✅ DESPUÉS (CORRECTO)
function canViewAll(usuario) {
  return usuario.rol === 'admin' || usuario.rol === 'secretaria';
}
```

---

### 2. **Endpoints sin autenticación ni control de acceso** ⚠️ CRÍTICO
**Archivo:** `backend/src/routes/reasignados.js`

#### a) GET /:id (línea 86)
- ❌ Sin `requireAuth` - cualquiera puede acceder
- ❌ Sin control de acceso - no verifica si es el usuario asignado

**Corrección:** Agregado `requireAuth` y verificación de que es usuario asignado o admin/secretaria

#### b) PUT /:id (línea 94)
- ❌ Sin `requireAuth` - cualquiera puede modificar documentos
- ❌ Sin control de acceso - no verifica que sea el propietario

**Corrección:** Agregado `requireAuth` y verificación de permisos

#### c) POST / (línea 37)
- ❌ Sin `requireAuth` - cualquiera puede crear documentos
- Sin restricción de rol - debería ser solo admin/secretaria

**Corrección:** Agregado `requireAuth` y verificación de `canViewAll` (solo admin/secretaria)

#### d) DELETE /:id (línea 212)
- ❌ Sin `requireAuth` - cualquiera puede eliminar documentos
- Sin restricción de rol - debería ser solo admin/secretaria

**Corrección:** Agregado `requireAuth` y restricción a solo admin/secretaria

---

### 3. **Comentarios sin control de acceso** ⚠️ CRÍTICO
**Archivo:** `backend/src/routes/comentarios.js`

#### a) GET /reasignados/:reasignadoId/comentarios (línea 9)
- ❌ Sin verificación de permisos - usuario puede ver comentarios de documentos ajenos

**Corrección:** Agregado control que verifica:
- Si no es admin/secretaria: debe ser el usuario asignado al documento
- Si es admin/secretaria: puede ver cualquier documento

#### b) POST /reasignados/:reasignadoId/comentarios (línea 39)
- ❌ Sin control de acceso - usuario puede comentar en documentos ajenos

**Corrección:** Agregado control similar al GET

---

### 4. **Estructura de archivo incorrecta** ⚠️ MODERADO
**Archivo:** `backend/src/routes/reasignados.js`

**Problema:** `module.exports = router;` estaba en línea 83, ANTES de definir los endpoints CRUD

**Corrección:** Movido `module.exports` al final del archivo (después de DELETE)

---

## ✅ Resumen de Correcciones

| Archivo | Problema | Tipo | Estado |
|---------|----------|------|--------|
| auth.js | canViewAll retorna true para solo_vista | CRÍTICO | ✅ Corregido |
| reasignados.js | GET /:id sin auth ni control acceso | CRÍTICO | ✅ Corregido |
| reasignados.js | PUT /:id sin auth ni control acceso | CRÍTICO | ✅ Corregido |
| reasignados.js | POST / sin auth ni restricción rol | CRÍTICO | ✅ Corregido |
| reasignados.js | DELETE /:id sin auth ni restricción rol | CRÍTICO | ✅ Corregido |
| reasignados.js | module.exports en posición incorrecta | MODERADO | ✅ Corregido |
| comentarios.js | GET comentarios sin control acceso | CRÍTICO | ✅ Corregido |
| comentarios.js | POST comentarios sin control acceso | CRÍTICO | ✅ Corregido |

---

## 🔒 Comportamiento Después de las Correcciones

### Usuario con rol "solo_vista"
- ✅ Solo puede ver documentos asignados a él
- ✅ Solo puede comentar en sus propios documentos
- ✅ No puede crear, editar ni eliminar documentos
- ✅ No puede ver comentarios de documentos de otros usuarios

### Usuario con rol "admin" o "secretaria"
- ✅ Puede ver TODOS los documentos
- ✅ Puede ver TODOS los comentarios
- ✅ Puede crear, editar y eliminar documentos
- ✅ Puede comentar en cualquier documento

---

## ⚠️ Próximos Pasos

1. **Reiniciar backend** para aplicar los cambios
2. **Probar con usuario "solo_vista":**
   - ✅ Verificar que solo ve sus documentos en `/api/reasignados`
   - ✅ Intentar acceder a documento ajeno: debe obtener 403
   - ✅ Intentar editar documento ajeno: debe obtener 403
   - ✅ Intentar crear documento: debe obtener 403
3. **Probar con usuario "admin":**
   - ✅ Verifica que ve TODOS los documentos
   - ✅ Puede editar documentos de otros usuarios
   - ✅ Puede eliminar documentos

---

## 📋 Archivos Modificados

1. `backend/src/middleware/auth.js` - Función canViewAll
2. `backend/src/routes/reasignados.js` - Todos los endpoints
3. `backend/src/routes/comentarios.js` - GET y POST de comentarios
