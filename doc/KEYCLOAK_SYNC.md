# Sincronización de Usuarios desde Keycloak

## Descripción

El sistema SISTRA sincroniza automáticamente el catálogo de empleados desde Keycloak diariamente. Esta sincronización:

- ✅ Obtiene usuarios activos de Keycloak
- ✅ Sincroniza nombre, email, cargo, gerencia y teléfono
- ✅ Mantiene actualizado el catálogo sin acción manual
- ✅ Se ejecuta automáticamente cada día a una hora configurada

## Configuración Requerida

### 1. Variables de Entorno

En tu archivo `.env`, asegúrate de tener:

```env
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=http://tu-keycloak:8080
KEYCLOAK_REALM=tu-realm
KEYCLOAK_CLIENT_ID=sistra-app
KEYCLOAK_CLIENT_SECRET=tu-secret-confidencial
```

El `CLIENT_SECRET` es necesario para que el backend se autentique como cliente confidencial y obtenga los usuarios.

### 2. Configurar Atributos Personalizados en Keycloak

Cada usuario en Keycloak debe tener los siguientes atributos personalizados:

- **cargo**: Posición/puesto del empleado (ej: "Gerente de Proyecto")
- **gerencia**: Departamento/área (ej: "Dirección de Turismo")
- **telefono**: Número de teléfono (ej: "0987654321")

**Para agregar atributos a un usuario en Keycloak:**

1. Ir a Keycloak Admin Console
2. Seleccionar Realm → Usuarios
3. Abrir el usuario específico
4. Ir a la pestaña "Atributos"
5. Agregar los atributos:
   - Key: `cargo`, Value: valor específico
   - Key: `gerencia`, Value: valor específico
   - Key: `telefono`, Value: valor específico
6. Guardar

O usar la API de Keycloak:

```bash
# Actualizar atributos de un usuario
curl -X PUT \
  "http://keycloak:8080/admin/realms/tu-realm/users/USER_ID" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "cargo": ["Gerente"],
      "gerencia": ["Dirección de Turismo"],
      "telefono": ["0987654321"]
    }
  }'
```

## Programación de Sincronización

La sincronización se ejecuta automáticamente una vez al día:

- **Hora de sincronización**: 30 minutos antes de la hora configurada para envío de notificaciones
- **Zona horaria**: Configurada en `TIMEZONE` (default: America/Guayaquil)
- **Hora por defecto**: 07:30 AM Ecuador (si no se especifica otra hora)

Ejemplo:
```env
TIMEZONE=America/Guayaquil
# Si HORA_ENVIO=08:00, la sincronización ocurrirá a 07:30
```

## Usar Manualmente

### Forzar Sincronización Inmediata

Para sincronizar usuarios manualmente en cualquier momento:

```bash
curl -X POST http://tu-servidor:3000/api/test/sync-keycloak
```

Respuesta:
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

### Verificar Estado

Verificar que los usuarios están sincronizados:

```bash
# Ver todos los usuarios
curl http://tu-servidor:3000/api/usuarios

# Ver usuarios activos
curl http://tu-servidor:3000/api/usuarios/activos/lista
```

## Proceso de Sincronización

1. **Obtener Token**: Se solicita un token de acceso a Keycloak con credenciales de cliente
2. **Descargar Usuarios**: Se obtienen todos los usuarios activos de Keycloak (paginado)
3. **Procesar Atributos**: Se extraen nombre, email, cargo, gerencia y teléfono
4. **Insertar/Actualizar BD**: Se sincroniza con la tabla de usuarios en MySQL
   - Si el usuario no existe: Se inserta
   - Si existe: Se actualiza solo los datos sincronizables
5. **Registro**: Se registra el resultado de la sincronización

## Solución de Problemas

### Error: "Failed to get token"

**Causa**: El CLIENT_SECRET es incorrecto o no está configurado

**Solución**:
1. Verifica que `KEYCLOAK_CLIENT_SECRET` está correctamente configurado
2. Asegúrate que el cliente en Keycloak es "confidential" (no public)
3. Regenera el secret si es necesario

### Error: "Failed to fetch users"

**Causa**: El token no tiene permisos suficientes o la URL es incorrecta

**Solución**:
1. Verifica que `KEYCLOAK_URL` es correcta (sin `/auth` al final si es Keycloak 17+)
2. Asegúrate que el cliente tiene el role "manage-users" en el realm

### Los usuarios no se sincronizan completamente

**Causa**: Faltan atributos personalizados en Keycloak

**Solución**:
1. Verifica que cada usuario tiene los atributos: `cargo`, `gerencia`, `telefono`
2. Los campos vacíos en los atributos se guardarán como NULL en la BD (está bien)

### Ver Logs

Los logs de sincronización se muestran cuando se inicia el servidor y en cada ejecución:

```
🔄 Iniciando sincronización de usuarios desde Keycloak...
✅ Token de Keycloak obtenido
📥 Lote 1: 100 usuarios descargados (total: 100)
✅ Total de usuarios descargados: 100
...
✨ Sincronización completada:
   ✅ Insertados: 5
   🔄 Actualizados: 12
   ❌ Errores: 0
```

## Consideraciones de Seguridad

- ⚠️ El `KEYCLOAK_CLIENT_SECRET` debe ser tratado como una credencial sensible
- ⚠️ No commitear el `.env` con secrets en el repositorio
- ⚠️ Usar variables de entorno o secrets management en producción
- ⚠️ Solo usuarios con rol admin pueden iniciar sincronización manual

## Estructura de Datos

### Tabla: usuarios

```sql
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255),
  correo VARCHAR(255) UNIQUE,
  cargo VARCHAR(255),
  gerencia VARCHAR(255),
  telefono VARCHAR(20),
  estado ENUM('activo', 'inactivo'),
  extra JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

El campo `extra` almacena:
- `keycloakId`: ID del usuario en Keycloak
- `syncedAt`: Timestamp de la última sincronización

## Referencias

- [Documentación de Keycloak Admin API](https://www.keycloak.org/docs/latest/server_admin/)
- [Configuración de atributos personalizados](https://www.keycloak.org/docs/latest/server_admin/#user-attributes)
