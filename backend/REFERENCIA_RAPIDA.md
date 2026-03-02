# REFERENCIA RÁPIDA - Notificaciones

## 🚀 INICIO RÁPIDO (5 minutos)

```bash
# 1. Aplicar migraciones
npm run migrate

# 2. Crear archivo .env (copiar .env.example)
# Editar: MAIL_USER y MAIL_PASS

# 3. Insertar usuarios
mysql -u root -p seguimiento_v2 < script_insertar_usuarios.sql

# 4. Asignar usuario_id a documentos
# UPDATE reasignados SET usuario_id = 1 WHERE id = 123;

# 5. Reiniciar servidor
npm run dev

# 6. Probar
npm run test-notif
```

---

## 📧 VARIABLES DE ENTORNO (.env)

```env
# OBLIGATORIO
MAIL_USER=tu-email@empresa.com.ar
MAIL_PASS=contraseña-de-aplicacion

# OPCIONAL (tienen valores por defecto)
MAIL_HOST=outlook.office365.com
MAIL_PORT=587
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=seguimiento_v2
PORT=3000
CRON_SCHEDULE=0 8 * * *
TIMEZONE=America/Argentina/Buenos_Aires
```

---

## 🔗 ENDPOINTS

```bash
# Usuarios
GET    /api/usuarios              # Listar todos
POST   /api/usuarios              # Crear
GET    /api/usuarios/:id          # Obtener uno
PUT    /api/usuarios/:id          # Actualizar
DELETE /api/usuarios/:id          # Eliminar
GET    /api/usuarios/gerencia/:g  # Por gerencia

# Pruebas
POST   /api/test/notificaciones   # Ejecutar notificaciones
GET    /api/health/mail           # Verificar SMTP
```

---

## 🗄️ SQL ÚTIL

```sql
-- Ver usuarios
SELECT * FROM usuarios;

-- Ver documentos con usuario_id
SELECT numero_documento, reasignado_a, usuario_id FROM reasignados;

-- Asignar usuario a documento
UPDATE reasignados SET usuario_id = 1 WHERE id = 100;

-- Ver documentos expirados
SELECT * FROM reasignados 
WHERE DATE(fecha_max_respuesta) < DATE(NOW());

-- Ver documentos que vencen mañana
SELECT * FROM reasignados 
WHERE DATE(fecha_max_respuesta) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY));

-- Limpiar historial de correos (re-enviar notificaciones)
UPDATE reasignados 
SET correo_enviado_expiracion = 'no', correo_enviado_un_dia_antes = 'no';

-- Crear usuario de prueba
INSERT INTO usuarios (nombre, correo, cargo, gerencia) 
VALUES ('Test', 'test@empresa.com', 'Gerente', 'Prueba');

-- Obtener usuario creado
SELECT LAST_INSERT_ID() AS usuario_id;
```

---

## 🧪 PRUEBAS

```bash
# Test completo
npm run test-notif

# Forzar notificaciones vía API
curl -X POST http://localhost:3000/api/test/notificaciones

# Verificar conexión SMTP
curl http://localhost:3000/api/health/mail

# Crear usuario vía API
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Juan",
    "correo":"juan@empresa.com",
    "cargo":"Gerente",
    "gerencia":"Sistemas"
  }'

# Listar usuarios
curl http://localhost:3000/api/usuarios
```

---

## ⚙️ CAMBIAR HORA DEL CRONJOB

Editar `.env` - CRON_SCHEDULE:

```
0 6 * * *     → 6:00 AM todos los días
0 8 * * *     → 8:00 AM todos los días
0 12 * * *    → 12:00 PM todos los días
0 0 * * *     → 12:00 AM (medianoche)
0 */4 * * *   → Cada 4 horas
0 8 * * 1     → Lunes 8:00 AM
0 8 * * 1-5   → Lunes a viernes 8:00 AM
```

Luego: `npm run dev` (reiniciar servidor)

---

## 🔧 TROUBLESHOOTING RÁPIDO

| Problema | Solución |
|----------|----------|
| Correos no se envían | `npm run test-notif` + revisar logs |
| Error SMTP | Verificar MAIL_USER/PASS en .env |
| Usuario no recibe | Verificar usuario_id en BD |
| Cambios en .env no aplican | Reiniciar: `npm run dev` |
| Migración falla | Revisar que MySQL está funcionando |
| Error "Module not found" | `npm install` en directorio backend |

---

## 📁 ARCHIVOS IMPORTANTES

```
backend/
├── .env                              ← Configuración (SECRETO)
├── .env.example                      ← Plantilla
├── NOTIFICACIONES.md                 ← Documentación completa
├── RESUMEN_IMPLEMENTACION.txt        ← Tu resumen
├── FAQ.md                            ← Preguntas frecuentes
├── script_insertar_usuarios.sql      ← Usuarios de ejemplo
├── migrations/
│   └── 003_create_users_table.sql    ← Tabla usuarios
├── src/
│   ├── index.js                      ← Servidor principal + cronjob
│   ├── test_notifications.js         ← Script de prueba
│   ├── services/
│   │   ├── mailService.js            ← Envío de correos
│   │   └── notificationService.js    ← Lógica de búsqueda
│   └── routes/
│       └── usuarios.js               ← API de usuarios
```

---

## 📝 CHECKLIST DE CONFIGURACIÓN

- [ ] npm install en backend
- [ ] .env configurado con MAIL_USER y MAIL_PASS
- [ ] npm run migrate ejecutado
- [ ] Usuarios creados en BD
- [ ] usuario_id asignado a documentos
- [ ] npm run dev iniciado
- [ ] npm run test-notif pasó exitosamente
- [ ] Ejemplos de correo revisados

---

## 🔐 OBTENER CONTRASEÑA DE APLICACIÓN

**OUTLOOK:**
1. https://account.microsoft.com/security/app-passwords
2. Generar para "Otra aplicación (IMAP/SMTP)"
3. Copiar contraseña a .env

**GMAIL:**
1. https://myaccount.google.com/app-passwords
2. Seleccionar "Mail" y "Windows Computer" (o tu OS)
3. Copiar contraseña a .env

**SERVIDOR PERSONALIZADO:**
1. Contactar a administrador de tu servidor
2. Solicitar usuario y contraseña SMTP

---

## 📊 FORMATO CRONJOB

`segundo minuto hora día_mes mes día_semana`

Valores:
- Segundo: 0-59
- Minuto: 0-59
- Hora: 0-23
- Día del mes: 1-31
- Mes: 1-12 o JAN-DEC
- Día semana: 0-7 o SUN-SAT (0 y 7 = domingo)

Operadores:
- `*` = cualquier valor
- `*/n` = cada n unidades
- `n-m` = rango
- `n,m,p` = lista

---

## 📞 COMANDOS ÚTILES

```bash
# Ver logs en tiempo real
npm run dev

# Reiniciar servidor
# Presiona Ctrl+C, luego: npm run dev

# Probar con test
npm run test-notif

# Ver procesos Node
tasklist | findstr node

# Matar proceso Node (Windows)
taskkill /PID <numero> /F

# Base de datos
mysql -u root -p seguimiento_v2
mysql -u root -p seguimiento_v2 < archivo.sql
```

---

## 💡 TIPS

✅ Guarda los ejemplos de correo en tu email para ver cómo se ven  
✅ Testa primero con usuario de prueba  
✅ Revisa logs cuando algo no funcione  
✅ Cambia hora del cronjob según tu zona horaria  
✅ Mantén .env seguro - no lo comitees  
✅ Usa contraseñas de aplicación, no contraseñas normales  

---

¿DUDAS? → Revisa NOTIFICACIONES.md y FAQ.md
