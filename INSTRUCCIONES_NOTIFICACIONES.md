# 📧 Instrucciones de Notificaciones por Correo - SITRA

## Descripción

El sistema SITRA cuenta con un completo sistema de notificaciones por correo electrónico que permite notificar a los usuarios sobre:

- **📎 Documentos Asignados**: Cuando se asigna un nuevo documento a un usuario
- **❌ Documentos Tarde (Vencidos)**: Cuando un documento excede su fecha máxima de entrega
- **⏰ Documentos Próximos a Vencer**: Cuando faltan 24 horas o menos para que un documento venza

## Configuración

### 1. Configuración SMTP en `.env`

Las credenciales SMTP deben estar configuradas en el archivo `.env`:

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=notificaciones@quito-turismo.gob.ec
SMTP_PASS=tu_contraseña
SMTP_FROM_EMAIL=notificaciones@quito-turismo.gob.ec
SMTP_FROM_NAME=SITRA - Sistema de Seguimiento
```

### 2. Habilitar Notificaciones en la Aplicación

1. Ir a **http://localhost:5175/admin/notificaciones**
2. Habilitar:
   - ✅ "Sistema de notificaciones activo"
   - ✅ "Notificaciones por correo"
   - ✅ "Notificaciones en la aplicación" (opcional)

### 3. Personalizar Plantillas

Las plantillas de notificación pueden personalizarse:

1. En **http://localhost:5175/admin/notificaciones**
2. Sección **"Plantillas de Notificación"**
3. Hacer clic en **"Editar"** para cualquier plantilla
4. Modificar el asunto y cuerpo HTML
5. Variables disponibles:
   - `{{nombre}}` - Nombre del usuario
   - `{{cantidad}}` - Cantidad de documentos
   - `{{numero_documento}}` - Número del documento
   - `{{tipo_documento}}` - Tipo del documento
   - `{{remitente}}` - Remitente
   - `{{fecha_max_respuesta}}` - Fecha límite
   - `{{asunto}}` - Asunto del documento
   - `{{url_sistema}}` - URL del sistema
   - `{{tabla_documentos}}` - Tabla HTML con documentos

## Pruebas

### Test de Plantillas

Para verificar que las plantillas se renderizan correctamente:

```bash
cd backend
node test_notifications.js
```

Esto mostrará cómo se vería cada plantilla con datos de ejemplo.

### Correo de Prueba

1. Ir a **http://localhost:5175/admin/notificaciones**
2. Sección **"Correo de Prueba"**
3. Ingresar un correo electrónico
4. Hacer clic en **"Enviar Correo de Prueba"**

El sistema enviará un correo de prueba para verificar que SMTP funciona correctamente.

### Enviar Notificaciones Ahora

Para enviar notificaciones inmediatamente sin esperar al cronograma automático:

1. Ir a **http://localhost:5175/admin/notificaciones**
2. Sección **"Enviar Notificaciones Ahora"**
3. Seleccionar:
   - **Documentos Tarde (Expirados)** - Notifica sobre documentos vencidos
   - **Documentos Próximos a Vencer** - Notifica documentos que vencen en 24 horas
4. Hacer clic en **"Enviar Notificaciones Ahora"**

El sistema procesará los documentos correspondientes y enviará los correos.

## Envíos Automáticos

### Cronograma

Los envíos automáticos se ejecutan a una hora configurable (por defecto: 08:00).

### Tipos de Envío

1. **Documentos Expirados**: Cada día a la hora configurada
2. **Documentos Próximos**: Cada día a la hora configurada

### Configuración

En **http://localhost:5175/admin/notificaciones**:

- **Hora de envío automático**: Hora UTC en formato HH:MM
- **Días de retraso para notificar**: Número de días después de expirar antes de notificar

## Historial de Envíos

En **http://localhost:5175/admin/notificaciones**, sección **"Historial de Envíos"**:

- Último envío de notificaciones
- Último envío de documentos expirados
- Último envío de documentos próximos
- Total de correos enviados hoy

Para actualizar el historial, hacer clic en **"Actualizar"**.

## Campos en la Base de Datos

### Tabla: `notificaciones_config`

```sql
SELECT * FROM notificaciones_config WHERE id = 1;
```

- `activo` - Si el sistema está activo (0/1)
- `hora_envio` - Hora del envío automático (HH:MM)
- `dias_retraso` - Días de retraso para notificar
- `notificaciones_email_activas` - Si los correos están habilitados (0/1)
- `notificaciones_app_activas` - Si las notificaciones en app están habilitadas (0/1)

### Tabla: `notificaciones_plantillas`

```sql
SELECT * FROM notificaciones_plantillas;
```

- `tipo` - Tipo: 'asignado', 'tarde', 'proximo_vencer'
- `asunto` - Asunto del correo
- `cuerpo_html` - Cuerpo HTML del correo

### Tabla: `notificaciones_log`

```sql
SELECT * FROM notificaciones_log ORDER BY fecha_envio DESC;
```

Registro de todos los correos y notificaciones enviadas.

## Troubleshooting

### Los correos no se envían

1. Verificar que `notificaciones_email_activas = 1` en `notificaciones_config`
2. Verificar credenciales SMTP en `.env`
3. Enviar un correo de prueba para verificar SMTP
4. Revisar los logs en la sección "Historial de Envíos"

### Plantillas no se renderizan correctamente

1. Usar solo HTML válido en el cuerpo
2. Las variables deben estar en formato: `{{nombre_variable}}`
3. Hacer clic en "Vista Previa" para ver cómo se vería

### Documentos no se encuentran para notificar

1. Verificar que los documentos existan en tabla `reasignados`
2. Verificar que `usuario_id` esté asignado al documento
3. Verificar el campo `estado` - ciertos estados excluyen la notificación

## Variables de Entorno Requeridas

```
# Configuración SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=

# URL del sistema
FRONTEND_URL=http://localhost:5175
```

## Endpoints API

### Obtener plantillas

```bash
GET /api/admin/notificaciones/plantillas
```

### Obtener una plantilla específica

```bash
GET /api/admin/notificaciones/plantillas/{tipo}
```

Ejemplo: `/api/admin/notificaciones/plantillas/asignado`

### Actualizar plantilla

```bash
PUT /api/admin/notificaciones/plantillas/{tipo}
Content-Type: application/json

{
  "asunto": "Nuevo asunto",
  "cuerpo_html": "<p>Nuevo cuerpo HTML</p>"
}
```

### Enviar correo de prueba

```bash
POST /api/admin/notificaciones/test-email
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

### Enviar notificaciones ahora

```bash
POST /api/admin/notificaciones/enviar-ahora
Content-Type: application/json

{
  "documentosExpirados": true,
  "documentosProximos": true
}
```

## Contacto

Para soporte con notificaciones, contactar al equipo de TIC.
