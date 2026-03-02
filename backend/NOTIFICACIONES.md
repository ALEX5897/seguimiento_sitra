# Sistema de Notificaciones por Correo - SISTRA

## 📧 Descripción

Sistema automático que envía correos a usuarios cuando tienen documentos expirados o próximos a expirar. Las notificaciones se envían:
- **1 día antes**: Notificación preventiva para documentos venciendo mañana
- **Cada día**: Reporte de documentos que ya están expirados

## 🚀 Configuración Inicial

### 1. Crear la tabla de usuarios

Ejecutar la migración:

```bash
cd backend
npm run migrate
```

Luego ejecutar manualmente el archivo de migración de usuarios:

```sql
-- Desde MySQL/MySQL Workbench o CLI
mysql -u root -p seguimiento_v2 < migrations/003_create_users_table.sql
```

### 2. Crear archivo `.env` en la carpeta backend

Copiar el contenido de `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus datos:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=seguimiento_v2

# Configuración de Correo (Outlook Office365)
MAIL_HOST=outlook.office365.com
MAIL_PORT=587
MAIL_USER=tu-email@empresa.com
MAIL_PASS=tu-contraseña-de-aplicación

# Cronjob - Se ejecuta cada día a las 08:00
CRON_SCHEDULE=0 8 * * *
TIMEZONE=America/Argentina/Buenos_Aires
```

### 3. Obtener contraseña de aplicación de Outlook

Para Office365, **no puedes usar tu contraseña normal**:

1. Ve a https://account.microsoft.com/
2. Selecciona **Seguridad** > **Contraseñas de aplicación**
3. Genera una contraseña para **Otra aplicación (IMAP/SMTP)**
4. Copia esa contraseña en `MAIL_PASS` en `.env`

> **Nota**: Si no ves la opción de "Contraseñas de aplicación", es porque tu cuenta no tiene autenticación de 2 factores habilitada. Habilítala primero.

### 4. Registrar usuarios en la base de datos

Acceder a `POST /api/usuarios` con datos:

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan.perez@empresa.com",
  "cargo": "Gerente de Trámites",
  "gerencia": "Gerencia de Trámites",
  "telefono": "+54 9 11 1234567"
}
```

O agregar manualmente en la BD:

```sql
INSERT INTO usuarios (nombre, correo, cargo, gerencia) VALUES 
('Juan Pérez', 'juan@empresa.com', 'Gerente', 'Gerencia de Trámites'),
('María García', 'maria@empresa.com', 'Analista', 'Gerencia de Sistemas');
```

### 5. Asociar usuarios a documentos

Al crear o editar un documento reasignado, asignar el `usuario_id`:

```sql
UPDATE reasignados 
SET usuario_id = 1  -- ID del usuario
WHERE id = 123;
```

### 6. Pruebas

**Probar conexión SMTP:**
```bash
curl http://localhost:3000/api/health/mail
```

**Forzar ejecución de notificaciones:**
```bash
curl -X POST http://localhost:3000/api/test/notificaciones
```

**Ver logs en la consola:**
El servidor mostrará detalles de cada correo enviado.

## 📋 Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/usuarios` | Obtener todos los usuarios |
| POST | `/api/usuarios` | Crear nuevo usuario |
| GET | `/api/usuarios/:id` | Obtener usuario por ID |
| PUT | `/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario |
| GET | `/api/usuarios/gerencia/:gerencia` | Obtener usuarios por gerencia |
| POST | `/api/test/notificaciones` | Ejecutar notificaciones manualmente |
| GET | `/api/health/mail` | Verificar conexión SMTP |

## 🔄 Flujo de funcionamiento

```
08:00 AM (Diariamente)
    ↓
Cronjob se ejecuta
    ↓
┌─ Buscar documentos expirados (fecha < hoy)
│  que NO han recibido notificación
│
├─ Buscar documentos próximos (fecha = mañana)
│  que NO han recibido notificación de "1 día antes"
│
└─ Agrupar por usuario
    ↓
Para cada usuario:
  └─ Enviar correo con tabla de documentos

Cuando se envía:
  └─ Marcar en BD: correo_enviado_expiracion = 'si'
  └─ Marcar en BD: correo_enviado_un_dia_antes = 'si'
```

## 📧 Formato del correo

El correo incluye:

1. **Encabezado** con título y nombre del usuario
2. **Tabla de documentos** con:
   - Número de documento
   - Número de trámite
   - Tipo de documento
   - Remitente y destinatario
   - Asunto
   - Fecha máxima de respuesta
   - Estado (Expirado / Próximo a expirar)
3. **Pie de página** con fecha y nota de que es automático

## 🛠️ Troubleshooting

### Error: "SMTP Error: Could not authenticate"

- Verificar que `MAIL_USER` y `MAIL_PASS` son correctas
- Si usas Office365, asegurar que es contraseña de aplicación, NO contraseña normal
- Verificar que la autenticación de 2 factores está habilitada

### Error: "Cannot find module 'nodemailer'"

```bash
cd backend
npm install nodemailer node-cron dotenv
```

### Los correos no se envían

1. Verificar conexión SMTP: `curl http://localhost:3000/api/health/mail`
2. Revisar logs en consola del servidor
3. Verificar que los documentos tienen `usuario_id` asignado
4. Verificar que el usuario tiene correo registrado

### Cambiar hora del cronjob

Editar `CRON_SCHEDULE` en `.env`:
- `0 8 * * *` = 08:00 cada día
- `0 9 * * *` = 09:00 cada día
- `0 0 * * *` = 00:00 (Medianoche)
- `0 */4 * * *` = Cada 4 horas

## 📝 Variables de entorno (detalle)

```env
CRON_SCHEDULE=0 8 * * *
```

Formato: `segundo minuto hora día_mes mes día_semana`

Ejemplos:
- `0 8 * * *` = Cada día a las 8:00 AM
- `0 8 * * 1` = Cada lunes a las 8:00 AM
- `0 8,12,16 * * *` = Cada día a las 8, 12 y 16 horas
- `0 */2 * * *` = Cada 2 horas

## 🔐 Seguridad

- Las contraseñas de aplicación de Office365 son más seguras que contraseñas normales
- Nunca comitear el archivo `.env` a Git
- Agregar `.env` al `.gitignore`
- Usar variables de entorno para producción

## 📞 Soporte

Para errores específicos, revisar los logs en tiempo real en la consola del servidor al ejecutar `npm run dev`.
