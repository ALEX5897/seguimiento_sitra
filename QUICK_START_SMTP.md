# ⚡ Quick Start: Configuración SMTP Avanzada

## En 3 pasos

### 1️⃣ Iniciar los servidores
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (en otra terminal)
cd frontend
npm run dev
```

### 2️⃣ Abrir la página
```
http://localhost:5175/admin/notificaciones
```

### 3️⃣ Hacer login y configurar
- Login con usuario admin (Keycloak)
- Scroll a **"Configuración SMTP Avanzada"**
- Cambiar cualquier parámetro
- Click en **"Guardar Configuración SMTP"**
- ✅ ¡Listo!

---

## 📋 Parámetros Configurables

| Parámetro | Ejemplo | Descripción |
|---|---|---|
| **Email From** | notificaciones@quito-turismo.gob.ec | Quién envía |
| **Nombre Remitente** | SITRA - Seguimiento | Nombre visible |
| **Responder A** | soporte@quito-turismo.gob.ec | Email de respuesta |
| **CC** | admin@ex.com, supervisor@ex.com | Copias |
| **BCC** | auditoria@ex.com | Copias ocultas |
| **SMTP Host** | smtp.office365.com | Servidor |
| **Puerto SMTP** | 587 | Puerto (587, 465) |
| **Usuario SMTP** | user@company.com | Usuario |
| **Contraseña SMTP** | password | Contraseña |

---

## 🔄 Flujo de Datos

```
Frontend (Vue)
    ↓
cargarConfiguracionSMTP() [GET]
    ↓
Backend [/api/admin/notificaciones/smtp-config]
    ↓
Base de Datos [notificaciones_smtp_config]
    ↓
Respuesta con valores actuales
    ↓
Frontend muestra en formulario
    ↓
Usuario modifica campos
    ↓
guardarConfiguracionSMTP() [PUT]
    ↓
Backend actualiza BD
    ↓
Mensaje de éxito ✅
```

---

## 🧪 Verificación Rápida

```bash
# Verificar que todo está implementado
cd backend
node verify-smtp-implementation.js
```

Esperado: ✅ **¡VERIFICACIÓN COMPLETA!**

---

## 💾 API Endpoints

```bash
# GET - Ver configuración
curl http://localhost:3000/api/admin/notificaciones/smtp-config

# PUT - Actualizar configuración
curl -X PUT http://localhost:3000/api/admin/notificaciones/smtp-config \
  -H "Content-Type: application/json" \
  -d '{"email_cc": "test@example.com"}'
```

⚠️ Nota: Requiere sesión admin

---

## 📚 Documentación Completa

- `IMPLEMENTACION_SMTP_COMPLETADA.md` - Resumen ejecutivo
- `GUIA_CONFIGURACION_AVANZADA_CORREOS.md` - Detalles técnicos
- `GUIA_TESTING_SMTP_CONFIG.md` - Testing completo

---

## ✨ Características

✅ Cambiar remitente dinámicamente
✅ Enviar copias a múltiples cuentas
✅ Configurar servidor SMTP en tiempo real
✅ Sin reinicio del servidor
✅ Interfaz visual amigable
✅ Protegido con autenticación admin

---

## 🆘 Si algo no funciona

1. **Página no carga:** Verificar que frontend está corriendo en :5175
2. **Login no funciona:** Verificar que Keycloak está disponible
3. **Configuración no se guarda:** Ver logs del backend
4. **Botones deshabilitados:** Verificar que tienes rol admin

Ver `GUIA_TESTING_SMTP_CONFIG.md` para troubleshooting completo.

