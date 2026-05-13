# 📧 Guía: Configuración Avanzada de Correos

## 🎯 Descripción

Se ha agregado un **sistema completo de configuración de SMTP** que permite personalizar completamente cómo se envían los correos de notificación, incluyendo:

- ✅ **Cambiar remitente (From)**
- ✅ **Cambiar nombre del remitente**
- ✅ **Enviar copias (CC) a otras cuentas**
- ✅ **Enviar copias ocultas (BCC)**
- ✅ **Configurar email de respuesta (Reply-To)**
- ✅ **Cambiar servidor SMTP**
- ✅ **Todo se guarda en BD y persiste**

---

## 🔌 Endpoints API

### GET /api/admin/notificaciones/smtp-config
Obtener la configuración actual de SMTP.

**Respuesta:**
```json
{
  "id": 1,
  "email_from": "notificaciones@quito-turismo.gob.ec",
  "email_from_name": "SITRA - Sistema de Seguimiento",
  "email_reply_to": "soporte@quito-turismo.gob.ec",
  "email_cc": "admin@quito-turismo.gob.ec, supervisor@quito-turismo.gob.ec",
  "email_bcc": null,
  "smtp_host": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "notificaciones@quito-turismo.gob.ec",
  "smtp_password": "..."
}
```

### PUT /api/admin/notificaciones/smtp-config
Actualizar la configuración de SMTP.

**Body:**
```json
{
  "email_from": "otro@quito-turismo.gob.ec",
  "email_from_name": "Nuevo Nombre",
  "email_reply_to": "responder@quito-turismo.gob.ec",
  "email_cc": "copia@quito-turismo.gob.ec",
  "email_bcc": "copia_oculta@quito-turismo.gob.ec",
  "smtp_host": "smtp.office365.com",
  "smtp_port": 587,
  "smtp_user": "nuevo_usuario@quito-turismo.gob.ec",
  "smtp_password": "nueva_contraseña"
}
```

---

## 📋 Tabla en BD

### notificaciones_smtp_config

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

---

## 🛠️ Cómo Usar

### Opción 1: Usando cURL

```bash
# Obtener configuración actual
curl -X GET http://localhost:3000/api/admin/notificaciones/smtp-config \
  -H "Content-Type: application/json" \
  -b "connect.sid=your_session_id"

# Actualizar configuración
curl -X PUT http://localhost:3000/api/admin/notificaciones/smtp-config \
  -H "Content-Type: application/json" \
  -d '{
    "email_from": "nuevo@quito-turismo.gob.ec",
    "email_from_name": "Nuevo Sistema",
    "email_cc": "copia@quito-turismo.gob.ec"
  }' \
  -b "connect.sid=your_session_id"
```

### Opción 2: Usando Node.js

```javascript
async function actualizarConfiguracionSMTP() {
  const response = await fetch('/api/admin/notificaciones/smtp-config', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email_from: 'nuevo@quito-turismo.gob.ec',
      email_from_name: 'Nuevo Nombre',
      email_cc: 'admin@quito-turismo.gob.ec'
    })
  });
  
  const data = await response.json();
  console.log('Actualizado:', data);
}
```

### Opción 3: Usando Postman

1. **GET /api/admin/notificaciones/smtp-config**
   - Method: GET
   - URL: http://localhost:3000/api/admin/notificaciones/smtp-config
   - Auth: Incluir cookie de sesión

2. **PUT /api/admin/notificaciones/smtp-config**
   - Method: PUT
   - URL: http://localhost:3000/api/admin/notificaciones/smtp-config
   - Body (raw JSON):
   ```json
   {
     "email_from": "nuevo@quito-turismo.gob.ec",
     "email_from_name": "Nuevo Nombre"
   }
   ```

---

## 📝 Ejemplos de Configuración

### Ejemplo 1: Usar cuenta de soporte
```json
{
  "email_from": "soporte@quito-turismo.gob.ec",
  "email_from_name": "Soporte SITRA",
  "email_reply_to": "soporte@quito-turismo.gob.ec"
}
```

### Ejemplo 2: Copiar a administrador
```json
{
  "email_cc": "admin@quito-turismo.gob.ec",
  "email_bcc": "auditoria@quito-turismo.gob.ec"
}
```

### Ejemplo 3: Cambiar servidor SMTP
```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "tu_email@gmail.com",
  "smtp_password": "tu_contraseña_app"
}
```

---

## 🔄 Configuración Dinámica

La configuración se carga automáticamente de la BD cuando se envía cada correo. Esto significa:

✅ No necesitas reiniciar el servidor
✅ Los cambios son inmediatos
✅ Cada correo usa la configuración actual
✅ Si no existe en BD, fallback a .env

---

## 🐛 Troubleshooting

### Los cambios no se aplican

**Problema:** Cambié la configuración pero los correos siguen usando la anterior

**Solución:**
1. Verifica que la actualización fue exitosa (status 200)
2. Reinicia el servidor con: `npm run dev`
3. Intenta enviar un nuevo correo

### Correos no se envían después de cambiar SMTP

**Problema:** Después de cambiar el servidor SMTP, los correos no se envían

**Solución:**
1. Verifica que las credenciales SMTP sean correctas
2. Comprueba que el puerto SMTP sea correcto (587 o 465)
3. Intenta enviar un correo de prueba: `POST /api/admin/notificaciones/test-email`
4. Revisa los logs del servidor para mensajes de error

---

## 📊 Verificar Configuración

```bash
# Conectarse a BD y verificar
mysql -h 172.16.1.63 -u us_segdoc -p

# En MySQL:
SELECT * FROM notificaciones_smtp_config WHERE id = 1;
```

---

## 🔐 Seguridad

- ⚠️ La contraseña SMTP se guarda en la BD sin encripción
- ⚠️ Solo administradores pueden ver/cambiar la configuración
- ✅ Los cambios se registran en `updated_at`
- ✅ Usa HTTPS en producción

---

## 📌 Variables de Entorno Fallback

Si no existen en la BD, se usarán estos valores del .env:

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=notificaciones@quito-turismo.gob.ec
SMTP_PASSWORD=...
EMAIL_FROM=notificaciones@quito-turismo.gob.ec
EMAIL_FROM_NAME=SITRA - Sistema de Seguimiento
EMAIL_REPLY_TO=soporte@quito-turismo.gob.ec
EMAIL_CC=admin@quito-turismo.gob.ec
EMAIL_BCC=
```

---

## ✅ Conclusión

El sistema ahora es **completamente flexible** para personalizar cómo se envían los correos sin necesidad de modificar código o reiniciar el servidor. Todos los parámetros se pueden cambiar dinámicamente desde la BD.
