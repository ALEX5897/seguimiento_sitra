# ✅ Guía de Pruebas - CRUD Catálogo de Estados

## Acceso a la Página

1. Inicia sesión como **Administrador**
2. Ve a **Menú > Administración > Catálogos**
3. Deberías ver la tabla con 2 estados: Pendiente y Completo

## 📋 Operaciones CRUD

### 1️⃣ READ - Listar Estados

**Acción:** Abrir página de Catálogos

**Resultado esperado:**
```
┌────┬────────┬──────────┬───────────┬────────────────┬────────┬────────┐
│ ID │ Icono  │ Código   │ Nombre    │ Descripción    │ Color  │ Estado │
├────┼────────┼──────────┼───────────┼────────────────┼────────┼────────┤
│ 1  │ ⏳     │pendiente │ Pendiente │En espera...    │warning │✓Activo │
│ 2  │ ✓      │completo  │ Completo  │Documento proc..│success │✓Activo │
└────┴────────┴──────────┴───────────┴────────────────┴────────┴────────┘
```

---

### 2️⃣ CREATE - Crear Nuevo Estado

#### Paso 1: Abrir Formulario
- Click en botón **➕ Nuevo Estado**
- Se abrirá modal con formulario vacío

#### Paso 2: Completar Formulario
```
Código:       en_revision    (letras minúsculas y guiones bajos)
Nombre:       En Revisión
Descripción:  Documento en proceso de revisión
Icono:        🔍             (máximo 2 caracteres)
Color:        info           (cyan)
```

#### Paso 3: Guardar
- Click en **💾 Guardar**
- Toast: "✓ Estado creado correctamente"
- Modal se cierra automáticamente
- Nueva fila aparece en la tabla

#### Validaciones que Debe Cumplir

❌ **Error:** Código vacío
```
⚠️ El código es requerido
```

❌ **Error:** Código con mayúsculas
```
⚠️ El código debe contener solo letras minúsculas y guiones bajos
```

❌ **Error:** Código con caracteres especiales
```
⚠️ El código debe contener solo letras minúsculas y guiones bajos
```

❌ **Error:** Nombre vacío
```
⚠️ El nombre es requerido
```

❌ **Error:** Nombre demasiado largo
```
⚠️ El nombre no puede exceder 100 caracteres
```

❌ **Error:** Icono con más de 2 caracteres
```
⚠️ El icono debe ser máximo 2 caracteres
```

---

### 3️⃣ UPDATE - Editar Estado

#### Paso 1: Seleccionar Estado
- Click en botón **✏️** de cualquier estado activo
- Modal se abre con datos precargados

#### Paso 2: Modificar Datos
```
Nombre:       Pendiente (Actualizado)
Descripción:  Documento esperando procesamiento
Color:        secondary
Activo:       ✓ (marcado)
```

**Nota:** El campo "Código" está deshabilitado (no se puede cambiar)

#### Paso 3: Guardar
- Click en **💾 Guardar**
- Toast: "✓ Estado actualizado correctamente"
- Tabla se actualiza automáticamente

---

### 4️⃣ DELETE - Desactivar Estado

#### Paso 1: Seleccionar Estado
- En la tabla, click en botón **🗑️** (solo para estados activos)
- Aparecerá confirmación

#### Paso 2: Confirmar Acción
```
¿Desactivar el estado "Pendiente"?
[Cancelar] [Confirmar]
```

#### Paso 3: Resultado
- Toast: "✓ Estado "Pendiente" desactivado"
- Fila se vuelve gris
- Botón 🗑️ desaparece
- Aparece botón **↻ Reactivar**

---

### 5️⃣ REACTIVAR - Reactivar Estado Inactivo

#### Paso 1: Seleccionar Estado Inactivo
- En la tabla, click en botón **↻** (solo para estados inactivos)
- Aparecerá confirmación

#### Paso 2: Confirmar Acción
```
¿Reactivar el estado "Pendiente"?
[Cancelar] [Confirmar]
```

#### Paso 3: Resultado
- Toast: "✓ Estado "Pendiente" reactivado"
- Fila vuelve a color normal
- Botón ↻ desaparece
- Aparece botón 🗑️ nuevamente

---

## 🧪 Escenarios de Prueba

### Escenario 1: Flujo Completo
```
1. ✅ Crear estado "en_aprobacion"
2. ✅ Verificar que aparece en tabla
3. ✅ Editar cambiar color a "info"
4. ✅ Verificar cambio en tabla
5. ✅ Desactivar estado
6. ✅ Verificar aparece como inactivo
7. ✅ Reactivar estado
8. ✅ Verificar vuelve a activo
```

### Escenario 2: Validaciones
```
1. ✅ Intentar crear sin código → Error
2. ✅ Intentar crear con código "Mayuscula123" → Error
3. ✅ Intentar crear con nombre vacío → Error
4. ✅ Intentar crear con icono "🎉🎉🎉" (3 chars) → Error
5. ✅ Crear con datos válidos → Éxito
```

### Escenario 3: Estados Inactivos
```
1. ✅ Desactivar estado "completo"
2. ✅ Verificar fila en gris
3. ✅ Intentar editar estado inactivo (debe permitirse)
4. ✅ Cambiar estado inactivo a activo → Éxito
5. ✅ Fila vuelve a color normal
```

### Escenario 4: Codigos Duplicados
```
1. ✅ Crear estado "nuevo_test"
2. ❌ Intentar crear otro "nuevo_test" → Error: "El código del estado ya existe"
```

---

## 🔧 Pruebas API (con curl)

### GET - Listar todos los estados
```bash
curl http://localhost:3000/api/catalogos/estados-reasignados
```

**Respuesta esperada:**
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
    ...
  }
]
```

### POST - Crear nuevo estado
```bash
curl -X POST http://localhost:3000/api/catalogos/estados-reasignados \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "en_revision",
    "nombre": "En Revisión",
    "descripcion": "Documento en proceso de revisión",
    "icono": "🔍",
    "color": "info"
  }'
```

**Respuesta esperada:**
```json
{
  "id": 3,
  "codigo": "en_revision",
  "nombre": "En Revisión"
}
```

### GET - Obtener estado específico
```bash
curl http://localhost:3000/api/catalogos/estados-reasignados/pendiente
```

### PUT - Actualizar estado
```bash
curl -X PUT http://localhost:3000/api/catalogos/estados-reasignados/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pendiente (Updated)",
    "color": "secondary",
    "activo": true
  }'
```

### DELETE - Desactivar estado
```bash
curl -X DELETE http://localhost:3000/api/catalogos/estados-reasignados/3
```

---

## ⚡ Checklist de Validación

### Frontend
- [ ] Página carga correctamente
- [ ] Se ven 2 estados iniciales (Pendiente, Completo)
- [ ] Botón "Nuevo Estado" funciona
- [ ] Modal se abre correctamente
- [ ] Validaciones funcionan
- [ ] Crear nuevo estado funciona
- [ ] Editar estado funciona
- [ ] Desactivar estado funciona
- [ ] Reactivar estado funciona
- [ ] Toast messages aparecen
- [ ] Tabla se actualiza después de cada acción

### Backend
- [ ] API responde en `/api/catalogos/estados-reasignados`
- [ ] GET retorna lista de estados
- [ ] POST crea nuevo estado
- [ ] PUT actualiza estado
- [ ] DELETE desactiva estado
- [ ] Validaciones funcionan
- [ ] Errores retornan mensaje adecuado

### Integración
- [ ] Frontend y backend se comunican correctamente
- [ ] Los cambios en frontend reflejan en BD
- [ ] Los cambios en BD aparecen en frontend después de recargar
- [ ] Confirmaciones funcionan correctamente
- [ ] Mensajes de error son claros

---

## 🐛 Reporte de Bugs

Si encuentras un error, anota:
1. **Acción:** Qué hiciste
2. **Resultado esperado:** Qué debería pasar
3. **Resultado actual:** Qué pasó en realidad
4. **Logs:** Mensajes de error en consola
5. **Pantalla:** Describe el estado visual

Ejemplo:
```
Acción: Crear estado con código "test@123"
Resultado esperado: Error de validación
Resultado actual: No muestra error, intenta crear
Logs: (ninguno)
```

---

**Última actualización:** 2026-05-12
**Versión:** 1.0
