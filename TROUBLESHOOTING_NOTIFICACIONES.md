# 🔧 Troubleshooting: Notificaciones No Se Envían Desde UI

## 🚨 Problema
Al hacer clic en "Enviar Notificaciones Ahora" en http://localhost:5175/admin/notificaciones, el sistema no envía los correos.

## ✅ Solución

### Paso 1: Verificar que Estés Logueado

1. **Abre la UI de admin:**
   - Ve a: http://localhost:5175/admin/notificaciones

2. **Verifica tu usuario:**
   - En la esquina superior derecha, deberías ver tu nombre/correo
   - Si ves "Inicia sesión" o "Login", no estás autenticado

3. **Si no estás logueado:**
   - Haz clic en "Iniciar sesión" o ve a: http://localhost:5175/login
   - Ingresa tus credenciales como admin
   - Vuelve a http://localhost:5175/admin/notificaciones

### Paso 2: Verifica el Estado de la Sesión

1. **Abre Developer Tools:**
   - Presiona `F12` en el navegador
   - Ve a la pestaña "Console"

2. **Ejecuta este comando en la consola:**
   ```javascript
   fetch('/api/debug-session/session-status')
     .then(r => r.json())
     .then(d => console.log(JSON.stringify(d, null, 2)))
   ```

3. **Resultado esperado:**
   ```json
   {
     "sessionID": "s%3A...",
     "hasSession": true,
     "usuario": {
       "correo": "tu.correo@quito-turismo.gob.ec",
       "nombre": "Tu Nombre",
       "rol": "admin"
     },
     "message": "✅ Usuario autenticado"
   }
   ```

4. **Si ves "Sin autenticación":**
   - La sesión se perdió
   - Vuelve a hacer login (Paso 1)
   - Intenta de nuevo

### Paso 3: Verifica la Solicitud POST

1. **Abre Developer Tools > Network tab:**
   - Presiona `F12`
   - Ve a "Network"

2. **Haz clic en "Enviar Notificaciones Ahora"**

3. **En Network, busca la solicitud POST:**
   - Debe haber una solicitud a `/api/admin/notificaciones/enviar-ahora`
   - Si no ves nada, mira si hay errores en la consola

4. **Haz clic en esa solicitud y ve a "Response":**
   - **Si ves 200 (OK):** 
     ```json
     {
       "success": true,
       "mensaje": "Se enviaron notificaciones: 5 correos...",
       "resultado": {...}
     }
     ```
     ✅ Los correos se están enviando
   
   - **Si ves 401 (Unauthorized):**
     ```json
     {"error": "No autenticado"}
     ```
     ❌ La sesión no está siendo enviada
     → Ve a Solución: Problema de Sesión

   - **Si ves 403 (Forbidden):**
     ```json
     {"error": "Requiere permisos de administrador"}
     ```
     ❌ Tu usuario no tiene rol admin
     → Contacta al administrador del sistema

### Paso 4: Testea el Envío Manual (Si seguimos con problemas)

1. **En el navegador, ve a DevTools > Console**

2. **Ejecuta este comando para simular un login de prueba:**
   ```javascript
   fetch('/api/debug-session/login-test', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ correo: 'test@quito-turismo.gob.ec', rol: 'admin' })
   })
   .then(r => r.json())
   .then(d => console.log('Login test:', d))
   ```

3. **Luego intenta hacer POST a enviar-ahora:**
   ```javascript
   fetch('/api/admin/notificaciones/enviar-ahora', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       documentosExpirados: true, 
       documentosProximos: true 
     })
   })
   .then(r => r.json())
   .then(d => console.log('Envío:', d))
   ```

4. **Si funciona con login-test pero no con tu login real:**
   - El problema está en cómo se establece tu sesión de usuario
   - Contacta al administrador del sistema

---

## 🔍 Diagnóstico Adicional

### Verifica los Logs del Servidor Backend

1. **En la terminal donde corre el servidor backend (npm run dev):**
   - Deberías ver logs cuando hagas la solicitud
   - Busca mensajes como:
     ```
     ⚠️ No hay usuario en session ni en req.user
     📧 [timestamp] Procesando documentos EXPIRADOS...
     ✅ Correo enviado a...
     ```

2. **Si ves "No hay usuario en session":**
   - La sesión no se está creando correctamente
   - Verifica que el usuario se logueó correctamente en el paso 1

### Verifica las Cookies

1. **DevTools > Application > Cookies:**
   - Ve a http://localhost:5175
   - Deberías ver una cookie llamada `connect.sid`
   - Si no existe, la sesión no se creó

2. **Si no ves `connect.sid`:**
   - Haz login de nuevo
   - La cookie debe aparecer después del login
   - Recarga la página

---

## 📊 Verificación de Correos Enviados

Si el sistema responde 200 (OK) pero los correos no llegan:

1. **Revisa la tabla de logs en la BD:**
   ```sql
   SELECT * FROM notificaciones_log 
   ORDER BY fecha_envio DESC 
   LIMIT 10;
   ```

2. **Deberías ver un registro con:**
   - `tipo: 'notificaciones_generales'`
   - `cantidad_correos: > 0`
   - `estado: 'enviado'`

3. **Si hay registros pero no reciben correos:**
   - Verifica que MAIL_TO_PRUEBA en .env apunta a tu correo
   - O revisa el inbox de acasa@quito-turismo.gob.ec (correo de prueba)
   - Busca en Spam/Correo no deseado

---

## 🚀 Solución Rápida de Emergencia

Si nada funciona desde la UI, puedes enviar notificaciones manualmente:

```bash
cd backend
node test_send_now.js
```

Esto ejecutará el mismo código de envío pero desde la terminal.

---

## 📞 Información de Soporte

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| 401 "No autenticado" | Sesión perdida | Haz login de nuevo |
| 403 "Sin permisos" | No eres admin | Solicita acceso admin |
| SMTP Error | Correo no configurado | Verifica SMTP_HOST en .env |
| Correos en Spam | Reputación del dominio | Contacta a TIC |

---

## ✅ Checklist de Verificación

- [ ] Estoy logueado como admin
- [ ] Veo mi usuario en la esquina superior derecha
- [ ] La sesión muestra usuario autenticado (Paso 2)
- [ ] La solicitud POST retorna 200 OK
- [ ] Los logs muestran "Correo enviado"
- [ ] Los correos llegan al inbox (o en MAIL_TO_PRUEBA)

Si todos los checks están ✅ pero aún hay problemas, contacta al equipo de desarrollo.
