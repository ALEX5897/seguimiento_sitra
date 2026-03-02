# FAQ - Preguntas Frecuentes

## Configuración

### P1: ¿Qué es una "contraseña de aplicación"?
**R:** Es una contraseña especial de 16 caracteres que genera Office365. Es más segura que tu contraseña normal porque:
- Solo funciona para SMTP
- No puedes usarla para login web
- Puedes revocarla sin cambiar contraseña normal
- Se genera en: https://account.microsoft.com/security/app-passwords

### P2: ¿Funciona con Gmail?
**R:** Sí, con cambios mínimos en .env:
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu-email@gmail.com
MAIL_PASS=contraseña-de-aplicacion-google
```
Nota: Gmail también usa contraseñas de aplicación.

### P3: ¿Funciona con otros servidores SMTP?
**R:** Sí. Solo necesitas:
- Host SMTP
- Puerto (normalmente 587 para TLS)
- Usuario y contraseña

### P4: ¿Dónde veo los logs?
**R:** En la consola cuando ejecutas `npm run dev`. Los logs muestran:
- ✅ Correos enviados exitosamente
- ❌ Errores de conexión
- ℹ️ Número de documentos procesados

---

## Funcionamiento

### P5: ¿Cuándo se envían los correos?
**R:** 
- **Cada día a las 8:00 AM** (configurable)
- **Documentos expirados**: Cada día si tiene nuevos
- **1 día antes**: Una sola vez, el día anterior al vencimiento

### P6: ¿Qué pasa si no hay documentos para notificar?
**R:** El sistema ejecuta pero no envía nada. Solo registra que pasó sin problemas.

### P7: ¿Qué pasa si un documento se marca como "resuelto"?
**R:** Se excluye automáticamente de las búsquedas. No recibe notificaciones.

### P8: ¿Un usuario puede recibir múltiples correos por el mismo documento?
**R:** No. El sistema marca cada documento como "correo_enviado = sí" para evitar duplicados.

### P9: ¿Qué pasa si el usuario no tiene correo registrado?
**R:** Se salta su notificación con un aviso en los logs.

### P10: ¿El servidor debe estar encendido 24/7?
**R:** Por supuesto. Si el servidor se apaga a las 7:50 AM, pierde la ejecución de las 8:00 AM.

---

## Base de Datos

### P11: ¿Cómo asocio un usuario a varios documentos?
**R:** Cada documento tiene su propio `usuario_id`. Ejemplo:
```sql
-- Juan (usuario_id=1) es responsable de 3 documentos
UPDATE reasignados SET usuario_id = 1 WHERE id IN (100, 101, 102);
```

### P12: ¿Puedo cambiar el usuario responsable de un documento?
**R:** Sí, solo actualiza el `usuario_id`:
```sql
UPDATE reasignados SET usuario_id = 2 WHERE id = 100;
```
Nota: Se reestablecen los flags de correo (`correo_enviado_*` se pueden limpiar).

### P13: ¿Las columnas `correo_enviado_*` son obligatorias?
**R:** No son obligatorias para CREATE, pero el sistema las usa. Si están NULL, se tratan como "no enviado".

### P14: ¿Qué pasa si el correo del usuario cambió?
**R:** Solo actualiza en la tabla usuarios:
```sql
UPDATE usuarios SET correo = 'nuevo@email.com' WHERE id = 1;
```

---

## Troubleshooting

### P15: Los correos no se envían - ¿qué reviso primero?
**R:**
1. ¿Está ejecutándose el backend? (`npm run dev`)
2. ¿El .env está configurado? (`npm run test-notif`)
3. ¿La conexión SMTP funciona? (`curl http://localhost:3000/api/health/mail`)
4. ¿Hay documentos expirados? (revisa la BD)
5. ¿Los documentos tienen usuario_id? (revisa la BD)
6. ¿El usuario tiene correo? (revisa tabla usuarios)

### P16: Cambié el .env pero no funciona
**R:** Reinicia el servidor:
```bash
# Presiona Ctrl+C en la consola
npm run dev
```

### P17: Error "SMTP authentication failed"
**R:**
- Verifica MAIL_USER y MAIL_PASS en .env
- Asegúrate de que es contraseña de APLICACIÓN, no contraseña normal
- Para Office365: https://account.microsoft.com/security/app-passwords
- Para Gmail: https://myaccount.google.com/app-passwords

### P18: Error "ECONNREFUSED"
**R:** El servidor SMTP no responde.
- Verifica MAIL_HOST y MAIL_PORT
- Intenta conexión manual: `telnet outlook.office365.com 587`

### P19: Error "ENOTFOUND"
**R:** El DNS no puede resolver el host.
- Verifica que escribiste correctamente MAIL_HOST
- Verifica que tienes conexión a internet

### P20: El correo llega al SPAM
**R:**
- Común en primeras pruebas
- Agrega el email del servidor a contactos
- Verifica que el servidor SMTP es confiable
- Revisa configuración de filtros del destinatario

---

## Mantenimiento

### P21: ¿Cómo limpio el historial de correos enviados?
**R:**
```sql
UPDATE reasignados SET correo_enviado_expiracion = 'no', correo_enviado_un_dia_antes = 'no';
```
Así se reenviarán notificaciones de documentos anteriores. ⚠️ Úsalo con cuidado.

### P22: ¿Puedo ejecutar notificaciones manualmente?
**R:** Sí:
```bash
curl -X POST http://localhost:3000/api/test/notificaciones
```

### P23: ¿Cómo cambio la hora del cronjob?
**R:** Edita .env:
```
# 6:00 AM
CRON_SCHEDULE=0 6 * * *

# 12:00 PM (Mediodía)
CRON_SCHEDULE=0 12 * * *

# Cada 4 horas
CRON_SCHEDULE=0 */4 * * *

# Solo los lunes a las 8:00 AM
CRON_SCHEDULE=0 8 * * 1
```

### P24: ¿Cómo veo quién recibió qué correo?
**R:** Revisa los logs en tiempo real cuando ejecutas `npm run dev`.
Ejemplo de log:
```
✅ Correo enviado a juan@empresa.com - Message ID: <xxx@outlook.com>
```

---

## Funcionalidades avanzadas

### P25: ¿Cómo agrego gerencias?
**R:** No hay tabla de gerencias. Son strings libres. Ejemplo:
```sql
INSERT INTO usuarios (nombre, correo, gerencia) VALUES
('Juan', 'juan@empresa.com', 'Gerencia de Sistemas'),
('María', 'maria@empresa.com', 'Gerencia de Sistemas'),
('Carlos', 'carlos@empresa.com', 'Gerencia de RR.HH.');
```

### P26: ¿Puedo enviar a múltiples usuarios por documento?
**R:** No directamente. Alternativas:
- Usar lista de distribución del correo (email group)
- Crear usuario "Equipo" con emails de múltiples personas
- Procesar manualmente y actualizar usuario_id

### P27: ¿Puedo cambiar el contenido del correo?
**R:** Sí, edita `src/services/mailService.js` en la función `generarTablaHTML()`.

### P28: ¿Puedo agregar más columnas en la tabla del correo?
**R:** Sí, edita la función `generarTablaHTML()` en mailService.js.

### P29: ¿Cómo hago que solo notifique documentos de una gerencia específica?
**R:** Requeriría cambio en el código. Contacta al administrador.

### P30: ¿Puedo guardar un registro de correos enviados?
**R:** Sí, agregando una tabla de `email_log`:
```sql
CREATE TABLE email_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT,
  reasignado_id BIGINT,
  tipo VARCHAR(50),  -- 'expirado' o 'proximo'
  correo_destino VARCHAR(255),
  enviado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Rendimiento

### P31: ¿El cronjob ralentiza el servidor?
**R:** No. Se ejecuta en background y no bloquea otras operaciones.

### P32: ¿Qué pasa con 1000 documentos expirados?
**R:** El sistema es eficiente. Procesa:
- Lectura de BD: ~50ms
- Agrupación: ~10ms
- Envío de correos: ~500ms c/u
- Total: ~5 segundos para 10 usuarios

### P33: ¿Limpieza automática de registros?
**R:** No. Los datos persisten indefinidamente. Puedes hacer limpieza manual:
```sql
DELETE FROM reasignados WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

---

## Seguridad

### P34: ¿Es seguro guardar contraseña en .env?
**R:** Sí, siempre que:
- .gitignore proteja .env
- Solo acceso local
- Servidor está asegurado con firewall
- Se usa contraseña de aplicación, no contraseña normal

### P35: ¿Puedo usar variables de entorno en servidor?
**R:** Sí, más seguro que .env local:
```bash
export MAIL_USER="email@empresa.com"
export MAIL_PASS="app-password"
npm run start
```

### P36: ¿Los correos se pueden interceptar?
**R:** Con TLS (puerto 587), el tráfico es encriptado. Es seguro.

---

¿Tienes otra pregunta? Revisa los logs o contacta al administrador.
