# 🧪 Guía de Testing: Configuración SMTP Avanzada

## ✅ Implementación Completada

### 1. Backend - Endpoints API
**Archivo:** `backend/src/routes/notificaciones-config.js`

#### GET `/api/admin/notificaciones/smtp-config`
- **Autenticación:** Requiere admin (middleware `requireAdmin`)
- **Respuesta:** Devuelve la configuración actual de SMTP desde la base de datos
- **Campos:** email_from, email_from_name, email_reply_to, email_cc, email_bcc, smtp_host, smtp_port, smtp_user, smtp_password

#### PUT `/api/admin/notificaciones/smtp-config`
- **Autenticación:** Requiere admin
- **Body:** Acepta cualquiera de los campos SMTP (todos opcionales)
- **Respuesta:** Devuelve la configuración actualizada con `success: true`

### 2. Base de Datos
**Tabla:** `notificaciones_smtp_config`

Estructura:
```sql
CREATE TABLE notificaciones_smtp_config (
  id INT PRIMARY KEY DEFAULT 1,
  email_from VARCHAR(255) NOT NULL,
  email_from_name VARCHAR(255) NOT NULL,
  email_reply_to VARCHAR(255),
  email_cc VARCHAR(500),
  email_bcc VARCHAR(500),
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_secure BOOLEAN DEFAULT 0,
  smtp_require_tls BOOLEAN DEFAULT 1,
  smtp_user VARCHAR(255),
  smtp_password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Estado:** ✅ Tabla creada, con datos iniciales

### 3. Frontend - Componente Vue
**Archivo:** `frontend/src/pages/AdminNotificaciones.vue`

#### Propiedades en data():
- `smtpConfig`: Objeto con todos los campos SMTP
- `guardandoSMTPConfig`: Boolean para estado del botón de guardar

#### Métodos:
- `cargarConfiguracionSMTP()`: GET /api/admin/notificaciones/smtp-config
- `guardarConfiguracionSMTP()`: PUT /api/admin/notificaciones/smtp-config

#### Formulario (línea 312-459):
- Sección "Configuración SMTP Avanzada" en col-md-12
- 8 campos de entrada: email_from, email_from_name, email_reply_to, email_cc, email_bcc, smtp_host, smtp_port, smtp_user, smtp_password
- 2 botones: "Guardar Configuración SMTP" y "Recargar"
- Se carga automáticamente en mounted()

---

## 🧪 Cómo Testar

### Opción 1: Desde el Navegador (Recomendado)

1. **Iniciar ambos servidores:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Abrir en navegador:**
   ```
   http://localhost:5175
   ```

3. **Hacer login con Keycloak:**
   - Si Keycloak está habilitado, seguir el flujo de login
   - Asegurar que el usuario sea **admin** (rol: 'admin' en usuarios_auth)

4. **Navegar a Notificaciones:**
   - Panel Admin → Notificaciones
   - O directamente: `http://localhost:5175/admin/notificaciones`

5. **Probar el formulario:**
   - Scroll hasta "Configuración SMTP Avanzada"
   - Ver los campos pre-cargados con valores actuales
   - Modificar un campo (ej: email_cc = "test@example.com")
   - Hacer clic en "Guardar Configuración SMTP"
   - ✅ Esperar mensaje: "✅ Configuración SMTP guardada correctamente"
   - Hacer clic en "Recargar" para verificar que los cambios persisten

### Opción 2: Test Manual con cURL

Primero obtener una sesión válida. Si tienes Keycloak acceso:

```bash
# 1. Obtener token de Keycloak (reemplazar con credenciales reales)
TOKEN=$(curl -X POST http://keycloak:8080/realms/sistra/protocol/openid-connect/token \
  -d "grant_type=password&client_id=sitra-client&username=USUARIO&password=PASS" \
  | jq -r '.access_token')

# 2. GET - Obtener configuración
curl -X GET http://localhost:3000/api/admin/notificaciones/smtp-config \
  -H "Authorization: Bearer $TOKEN"

# 3. PUT - Actualizar configuración
curl -X PUT http://localhost:3000/api/admin/notificaciones/smtp-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_cc": "supervisor@test.com",
    "email_from_name": "Sistema Test"
  }'
```

### Opción 3: Test Automatizado (Node.js)

**Archivo de test:** `backend/test-smtp-flow.js`

Este archivo requiere poder autenticarse. Si Keycloak está activo, necesitas proporcionar credenciales válidas.

```bash
cd backend
node test-smtp-flow.js
```

---

## 📋 Checklist de Funcionamiento

### Backend
- [ ] Endpoints GET y PUT registrados en express
- [ ] Middleware `requireAdmin` protege los endpoints
- [ ] Base de datos tabla existe con datos
- [ ] PUT actualiza correctamente los campos
- [ ] GET devuelve valores actuales

**Verificación rápida:**
```bash
# Ver que los endpoints existen
curl -v http://localhost:3000/api/admin/notificaciones/smtp-config
# Respuesta esperada: 401 Unauthorized (porque no hay sesión)
```

### Frontend
- [ ] Página `/admin/notificaciones` carga sin errores
- [ ] Sección "Configuración SMTP Avanzada" es visible
- [ ] Formulario se pre-carga con valores actuales en mounted()
- [ ] Cambios persisten después de guardar
- [ ] Botón "Guardar" muestra spinner mientras guarda
- [ ] Mensaje de éxito aparece después de guardar
- [ ] Botón "Recargar" actualiza los valores desde servidor

**Verificación desde consola del navegador:**
```javascript
// En la consola del navegador, después de cargar la página
console.log('smtpConfig:', this.$refs.__vue_app__._.appContext.components.AdminNotificaciones.data().smtpConfig);
```

### Integración
- [ ] Los cambios en BD se reflejan en el envío de correos
- [ ] email_cc recibe copias de los correos
- [ ] email_from es el remitente correcto
- [ ] email_from_name aparece en "De:" del correo

---

## 🔧 Troubleshooting

### Problema: 401 "No autenticado"
**Causa:** No hay sesión activa
**Solución:** Asegurar de hacer login primero en el navegador

### Problema: 403 "Requiere permisos de administrador"
**Causa:** El usuario no es admin
**Solución:** Usar cuenta con rol 'admin' en usuarios_auth

### Problema: Cambios no persisten
**Causa:** Error al guardar en BD
**Solución:**
1. Revisar logs del backend
2. Verificar que la tabla existe: `DESCRIBE notificaciones_smtp_config;`
3. Verificar que hay datos: `SELECT * FROM notificaciones_smtp_config WHERE id = 1;`

### Problema: Formulario no se carga
**Causa:** Error en mounted() al llamar cargarConfiguracionSMTP()
**Solución:**
1. Abrir DevTools (F12) → Console
2. Ver si hay errores de red
3. Revisar tab Network para ver la respuesta del API

---

## 📸 Características Implementadas

✅ **Personalización de remitente:** email_from y email_from_name
✅ **Copias (CC):** Enviar copia a múltiples cuentas
✅ **Copias ocultas (BCC):** Para auditoría sin que vean los destinatarios
✅ **Email de respuesta:** Campo reply-to configurable
✅ **Configuración SMTP dinámica:** Cambiar host, puerto, credenciales
✅ **Persistencia:** Todo se guarda en BD
✅ **Sin reinicio requerido:** Los cambios son inmediatos
✅ **Interfaz visual amigable:** Formulario organizado y responsive

---

## 📝 Notas Importantes

- ⚠️ **Seguridad:** La contraseña SMTP se guarda en texto plano en la BD. Considera encriptarla para producción.
- 🔄 **Sincronización:** La configuración se carga desde BD cada vez que se envía un correo
- 📧 **Fallback:** Si no existe configuración en BD, se usan variables de .env
- 🔑 **Admin only:** Solo usuarios con rol 'admin' pueden ver/cambiar esta configuración

---

## 🎯 Próximos Pasos Opcionales

1. **Encriptar contraseña SMTP:** Usar librería como `crypto` para encriptar/desencriptar
2. **Validar configuración:** Agregar botón "Probar Conexión SMTP"
3. **Historial de cambios:** Registrar quién cambió qué y cuándo
4. **Template variables:** Permitir más variables dinámicas en plantillas (ej: {{cc}}, {{bcc}})
5. **Múltiples configuraciones:** Soportar diferentes perfiles SMTP

