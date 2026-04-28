# Estado de Sincronización Keycloak - 28/04/2026

## ✅ Estado Actual

```
Total de Usuarios: 96
Estado: Todos ACTIVOS ✅
Correos: Formato corporativo (quito-turismo.gob.ec) ✅
Gerencias: 15 gerencias únicas
Sincronización Keycloak: Pendiente (primera ejecución)
```

## 📊 Distribución de Usuarios por Gerencia

| Gerencia | Cantidad |
|----------|----------|
| DIRECCIÓN DE SERVICIOS PARA LA INDUSTRIA TURÍSTICA | 26 |
| DIRECCIÓN ADMINISTRATIVA FINANCIERA / JEFATURA ADMINISTRATIVA | 11 |
| DIRECCION ADMINISTRATIVA FINANCIERA / JEFATURA FINANCIERA | 8 |
| DIRECCIÓN DE DESARROLLO DE PRODUCTOS SOSTENIBLES | 8 |
| DIRECCIÓN DE COMERCIALIZACIÓN | 6 |
| DIRECCIÓN DE PROMOCIÓN DEL DESTINO TURÍSTICO | 6 |
| DIRECCIÓN DE PLANIFICACIÓN ESTRATÉGICA E INFORMACIÓN | 5 |
| GERENCIA GENERAL | 5 |
| DIRECCIÓN DE COMUNICACIÓN | 4 |
| DIRECCIÓN DE PLANIFICACIÓN ESTRATÉGICA E INFORMACIÓN / JEFATURA DE SISTEMAS | 4 |
| DIRECCIÓN ADMINISTRATIVA FINANCIERA / JEFATURA DE TALENTO HUMANO | 3 |
| DIRECCIÓN DE ASESORÍA JURÍDICA | 3 |
| DIRECCIÓN DE TURISMO DE NEGOCIOS Y ATRACCIÓN DE EVENTOS | 3 |
| DIRECCIÓN ADMINISTRATIVA FINANCIERA | 2 |
| DIRECCIÓN ADMINISTRATIVA FINANCIERA / JEFATURA DE TALENTO HUMANO - UNIDAD DE RIESGOS | 2 |

## 🔧 Cambios Realizados

### 1. Verificación de Correos ✅
- **Antes**: Correos con dominio antiguo `quitoturismo.gob.ec`
- **Después**: Todos los correos actualizados a formato nuevo `quito-turismo.gob.ec`
- **Resultado**: 96 usuarios con correos corporativos válidos

### 2. Servicios de Sincronización Creados

#### `backend/src/services/keycloakSyncService.js`
- Servicio para sincronizar usuarios desde Keycloak
- Obtiene token administrativo
- Descarga usuarios paginados
- Mapea atributos personalizados (cargo, gerencia, teléfono)
- Inserta/actualiza usuarios en BD

#### `backend/src/sync_keycloak_match.js`
- Script para hacer match entre BD y Keycloak
- Usa similitud de nombres (Levenshtein distance)
- Actualiza correos automáticamente
- Maneja paginación de usuarios

#### `backend/src/sync_local_users.js`
- Script para verificar y actualizar correos localmente
- Genera correos basados en patrón de nombres
- Verifica duplicados
- Genera estadísticas

#### `backend/src/check_sync_status.js`
- Script para verificar estado actual de sincronización
- Muestra estadísticas de usuarios
- Verifica integridad de datos

### 3. Integración en API

#### Endpoints Agregados

```
POST /api/test/sync-keycloak
```
Fuerza la sincronización inmediata desde Keycloak
**Respuesta**:
```json
{
  "success": true,
  "resultado": {
    "inserted": 5,
    "updated": 12,
    "errors": 0,
    "totalProcessed": 17
  }
}
```

```
GET /api/admin/sync-status
```
Retorna estado actual de sincronización
**Respuesta**:
```json
{
  "totalUsuarios": 96,
  "porEstado": [
    { "estado": "activo", "cantidad": 96 }
  ],
  "sincronizadosKeycloak": 0,
  "gerenciasUnicas": 15,
  "listoParaSincronizar": true
}
```

### 4. Tareas Cron Configuradas

- **Sincronización Keycloak**: Diariamente a las 07:30 AM (Ecuador)
- **Notificaciones**: Diariamente a las 08:00 AM (Ecuador)
- La sincronización se ejecuta 30 minutos antes de las notificaciones

## 🚀 Cómo Usar

### Forzar Sincronización Manual

```bash
curl -X POST http://tu-servidor:3000/api/test/sync-keycloak
```

### Ver Estado de Sincronización

```bash
curl http://tu-servidor:3000/api/admin/sync-status
```

### Ejecutar Scripts Localmente

```bash
# Verificar estado
node backend/src/check_sync_status.js

# Sincronizar localmente (sin Keycloak)
node backend/src/sync_local_users.js
```

## ⚠️ Problemas Actuales

### Conectividad con Keycloak
- **Estado**: No se puede conectar a la API de Keycloak desde el servidor
- **URL Configurada**: `https://gia.quito-turismo.gob.ec`
- **Posibles Causas**:
  - La URL podría ser incorrecta
  - Problemas de firewall/CORS
  - Credenciales de cliente incorrectas
  - Keycloak podría no estar respondiendo

### Solución Recomendada

1. **Verificar conectividad a Keycloak**:
   ```bash
   curl -I https://gia.quito-turismo.gob.ec
   ```

2. **Verificar credenciales en .env**:
   - `KEYCLOAK_CLIENT_ID=sistra-app-oidc` ✓
   - `KEYCLOAK_CLIENT_SECRET=***` (verificar que es correcto)
   - `KEYCLOAK_REALM=quito-turismo` ✓

3. **Verificar que Keycloak responde a solicitudes de token**:
   ```bash
   curl -X POST \
     "https://gia.quito-turismo.gob.ec/realms/quito-turismo/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=sistra-app-oidc&client_secret=YOUR_SECRET"
   ```

## 📋 Próximos Pasos

### Cuando Keycloak esté disponible

1. **Validar conectividad**
   - Confirmar que Keycloak responde a las solicitudes de token
   - Verificar que las credenciales son correctas

2. **Agregar atributos personalizados a usuarios en Keycloak**
   - Cada usuario debe tener: `cargo`, `gerencia`, `telefono`
   - Ver `doc/KEYCLOAK_SYNC.md` para instrucciones

3. **Ejecutar sincronización inicial**
   ```bash
   curl -X POST http://tu-servidor:3000/api/test/sync-keycloak
   ```

4. **Verificar resultados**
   ```bash
   curl http://tu-servidor:3000/api/admin/sync-status
   ```

## 📚 Documentación Relacionada

- [`doc/KEYCLOAK_SYNC.md`](./KEYCLOAK_SYNC.md) - Guía completa de sincronización
- [`backend/.env.example`](../backend/.env.example) - Variables de entorno

## 🔐 Seguridad

- Las credenciales de Keycloak están en `.env` (no commiteadas)
- Los scripts de sincronización no almacenan credenciales
- Los datos sensibles se tratan como configuración de servidor

## 📞 Contacto

En caso de problemas con la sincronización:
1. Verificar logs del servidor: `node backend/src/index.js`
2. Ejecutar `node backend/src/check_sync_status.js` para diagnosticar
3. Revisar documentación en `doc/KEYCLOAK_SYNC.md`
