# 🔍 Paso a Paso para Debuggear el Problema de Notificaciones

## Situación Actual
- Eres admin ✅
- El botón "Enviar Notificaciones Ahora" no funciona ❌
- Los logs mejorados ahora te mostrarán exactamente qué está pasando

## 🎯 Plan de Acción

### PASO 1: Prepara el Terminal del Backend

1. En una terminal, navega a:
   ```bash
   cd "C:\Users\acasa\OneDrive - QuitoTurismo\Documentos\Desarrollo\Sis_asignacion de memos\seguimiento_sitra\backend"
   ```

2. Detén el servidor si está corriendo (Ctrl+C)

3. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Espera a que veas los mensajes de inicio. Deberías ver algo como:
   ```
   ✅ Keycloak habilitado
   o
   ℹ️  Keycloak deshabilitado - Usando autenticación por correo
   ```

5. **IMPORTANTE**: Mantén este terminal ABIERTO y visible

### PASO 2: Abre la UI de Notificaciones

1. Ve a http://localhost:5175
2. Verifica que estés logueado (deberías ver tu nombre en la esquina superior derecha)
3. Haz clic en "Admin" en el menú
4. Ve a "Notificaciones"

### PASO 3: Haz Clic en "Enviar Notificaciones Ahora"

1. En la sección "Enviar Notificaciones Ahora":
   - Asegúrate que ambos checkboxes estén marcados:
     - ☑️ Documentos Tarde (Expirados)
     - ☑️ Documentos Próximos a Vencer

2. **MIRA EL TERMINAL DEL BACKEND** en tiempo real

3. Haz clic en el botón: **"Enviar Notificaciones Ahora"**

### PASO 4: Lee los Logs del Backend

En el terminal deberías ver uno de estos mensajes:

#### Caso A: ✅ Acceso Permitido (Funciona)
```
✅ [requireAdmin] Usuario encontrado: Tu Nombre
   Rol: admin
   ✅ Acceso permitido

🚀 Iniciando envío manual de notificaciones...
📋 Procesando documentos expirados...
📧 [timestamp] Procesando documentos EXPIRADOS...
✅ Correo enviado a...
```

**Resultado:** Los correos se envían correctamente ✅

#### Caso B: ⚠️ No Autenticado (401)
```
⚠️  [requireAdmin] No hay usuario en session ni en req.user
   req.session: {id: '...', usuario: false}
   req.user: undefined
```

**Resultado:** El usuario no se está encontrando. Posible causa:
- Sesión no se está pasando correctamente
- Problema con Keycloak

#### Caso C: ⚠️ No es Admin (403)
```
✅ [requireAdmin] Usuario encontrado: Tu Nombre
   Rol: usuario
   ⚠️  Usuario no es admin. Rol: usuario
```

**Resultado:** Tu rol no es 'admin'. Causas posibles:
- Keycloak está asignándote un rol diferente
- El campo de rol tiene un nombre diferente

---

## 📋 Qué Hacer Según el Caso

### Si Es Caso A (Funciona):
- ¡Excelente! El sistema funciona correctamente
- Los correos se están enviando
- Verifica tu email para ver si llegaron

### Si Es Caso B (No Autenticado):

**Opción 1:** Cierra sesión y vuelve a loguear
```
1. Haz logout en la UI (esquina superior derecha)
2. Vuelve a hacer login
3. Ve a Admin → Notificaciones
4. Intenta de nuevo
```

**Opción 2:** Usa el formulario de test de sesión (en DevTools Console):
```javascript
// Abre DevTools (F12) → Console
fetch('/api/debug-session/session-status')
  .then(r => r.json())
  .then(d => console.log(d))
```
Esto te mostrará si la sesión existe y quién eres.

### Si Es Caso C (No es Admin):

Este es un problema de permisos. Necesitas:
1. Contactar al administrador del sistema
2. Solicitar que tu rol en Keycloak sea configurado como 'admin'
3. O verificar si Keycloak espera un rol diferente

---

## 🔧 Información Adicional que Necesitamos

Cuando ejecutes PASO 1-3, **copia y pega en tu próximo mensaje los logs completos** del terminal del backend que aparezcan cuando hagas clic en "Enviar Notificaciones Ahora".

Ejemplo de qué capturar:
```
[13/5/2026 16:25:30] POST /api/admin/notificaciones/enviar-ahora
⚠️  [requireAdmin] No hay usuario...
   req.session...
   req.user...
```

Con eso podré diagnosticar exactamente qué está pasando.

---

## 💡 Alternativa: Prueba el Endpoint Directamente

Si quieres probar sin UI:

```bash
cd backend
node test_send_now.js
```

Este script debería enviar 5 correos exitosamente (como hicimos antes). Si funciona, confirma que el backend está bien y el problema es solo con la autenticación en la API.

---

## 📌 Resumen

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Terminal: npm run dev | Backend corriendo |
| 2 | Login en http://localhost:5175 | UI abierta |
| 3 | Clic en "Enviar Notificaciones" | Solicitud enviada |
| 4 | Lee logs del terminal | Diagnostica problema |

**IMPORTANTE:** Los logs del terminal son la clave para resolver esto. Con ellos podré saber exactamente qué está pasando. 🔑
